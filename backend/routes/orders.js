import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import DeliveryPincode from '../models/DeliveryPincode.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendOrderConfirmation } from '../utils/emailService.js';

const router = express.Router();

// Create order
router.post('/', authenticate, authorize('customer'), async (req, res) => {
  try {

    const {
      items,
      addressId,
      couponCode,
      paymentMethod,
      deliveryDate,
      deliveryTime,
      razorpayOrderId,
      razorpayPaymentId
    } = req.body;

    // Validate deliveryDate
    if (!deliveryDate || isNaN(new Date(deliveryDate).getTime())) {
      return res.status(400).json({ message: 'Invalid or missing deliveryDate' });
    }

    // Check delivery pincode
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const pincodeCheck = await DeliveryPincode.findOne({
      pincode: address.pincode,
      isActive: true
    });

    if (!pincodeCheck) {
      return res.status(400).json({ message: 'Delivery not available for this pincode' });
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.name} not available` });
      }

      const weightOption = product.weightOptions.find(w => w.weight === item.weight);
      if (!weightOption) {
        return res.status(400).json({ message: `Invalid weight option for ${item.name}` });
      }

      subtotal += weightOption.price * item.quantity;
    }

    // Apply coupon
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (coupon) {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        if (subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
              discount = Math.min(discount, coupon.maxDiscount);
            }
          } else {
            discount = coupon.discountValue;
          }
        }
      }
    }

    const deliveryCharge = 0; // Can be configured
    const total = subtotal - discount + deliveryCharge;
    const commissionPercentage = 10; // Can be configured
    const commission = (total * commissionPercentage) / 100;

    const order = new Order({
      userId: req.user._id,
      addressId,
      items,
      subtotal,
      discount,
      couponCode: couponCode || '',
      deliveryCharge,
      total,
      commission,
      commissionPercentage,
      paymentMethod,
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderStatus: 'Pending'
    });


    await order.save();

    // Send order confirmation email to customer and admin(s)
    try {
      const user = await User.findById(req.user._id);
      const adminUsers = await User.find({ role: 'superAdmin', isActive: true });
      const adminEmails = adminUsers.map(admin => admin.email).filter(Boolean);

      const orderMailData = {
        orderId: order._id,
        total: order.total,
        deliveryDate: order.deliveryDate ? order.deliveryDate.toLocaleDateString() : '',
        deliveryTime: order.deliveryTime || ''
      };

      // Send to customer
      if (user && user.email) {
        await sendOrderConfirmation(user.email, orderMailData);
      }
      // Send to all admins
      for (const adminEmail of adminEmails) {
        await sendOrderConfirmation(adminEmail, orderMailData);
      }
    } catch (emailError) {
      console.error('Order confirmation email error:', emailError);
    }

    // Update product order counts
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { orderCount: item.quantity }
      });
    }

    // Update coupon usage
    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, {
        $inc: { usedCount: 1 }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/my-orders', authenticate, authorize('customer'), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('addressId')
      .populate('deliveryBoyId', 'name mobileNumber vehicleType vehicleNumber')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('addressId')
      .populate('deliveryBoyId', 'name mobileNumber vehicleType vehicleNumber')
      .populate('items.productId', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check access
    if (req.user.role === 'customer' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'deliveryBoy' && order.deliveryBoyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all orders
router.get('/admin/all', authenticate, authorize('superAdmin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.orderStatus = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate('userId', 'name email mobileNumber')
      .populate('addressId')
      .populate('deliveryBoyId', 'name mobileNumber vehicleType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Update order status
router.put('/:id/status', authenticate, authorize('superAdmin'), async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Assign delivery boy
router.put('/:id/assign-delivery', authenticate, authorize('superAdmin'), async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If deliveryBoyId is empty/null, clear the assignment
    if (!deliveryBoyId || deliveryBoyId === '') {
      order.deliveryBoyId = undefined;
      order.deliveryAssignedAt = undefined;
      // Revert status to Preparing if it was assigned
      if (order.orderStatus === 'Assigned to Delivery Boy') {
        order.orderStatus = 'Preparing';
      }
    } else {
      // Validate delivery boy exists and is active
      const deliveryBoy = await User.findById(deliveryBoyId);
      if (!deliveryBoy || deliveryBoy.role !== 'deliveryBoy' || !deliveryBoy.isActive) {
        return res.status(400).json({ message: 'Invalid or inactive delivery boy' });
      }

      order.deliveryBoyId = deliveryBoyId;
      order.deliveryAssignedAt = new Date();
      order.orderStatus = 'Assigned to Delivery Boy';
    }

    await order.save();

    // Populate delivery boy info for response
    await order.populate('deliveryBoyId', 'name mobileNumber vehicleType vehicleNumber');

    res.json(order);
  } catch (error) {
    console.error('Assign delivery boy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delivery boy: Get assigned orders
router.get('/delivery/my-orders', authenticate, authorize('deliveryBoy'), async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryBoyId: req.user._id,
      orderStatus: { $in: ['Assigned to Delivery Boy', 'Picked Up', 'Out for Delivery'] }
    })
      .populate('userId', 'name mobileNumber')
      .populate('addressId')
      .sort({ deliveryAssignedAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delivery boy: Update order status
router.put('/:id/delivery-status', authenticate, authorize('deliveryBoy'), async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryBoyId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

