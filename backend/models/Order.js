import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    required: true
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryAssignedAt: {
    type: Date
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    weight: {
      type: String,
      required: true
    },
    isEggless: {
      type: Boolean,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    default: 0
  },
  commissionPercentage: {
    type: Number,
    default: 10
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Preparing', 'Assigned to Delivery Boy', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Razorpay', 'Cash on Delivery'],
    required: true
  },
  razorpayOrderId: {
    type: String,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);

