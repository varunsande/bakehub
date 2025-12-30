import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cartItems, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    mobileNumber: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home'
  });
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [loading, setLoading] = useState(false);
  const [pincodeAvailable, setPincodeAvailable] = useState(null);
  const [showAddressOptions, setShowAddressOptions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (selectedAddress) {
      checkPincode();
    }
  }, [selectedAddress]);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get('/addresses');
      setAddresses(res.data);
      const defaultAddress = res.data.find(a => a.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress._id);
      } else if (res.data.length > 0) {
        setSelectedAddress(res.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const checkPincode = async () => {
    const address = addresses.find(a => a._id === selectedAddress);
    if (address) {
      try {
        const res = await axios.post('/delivery-pincodes/check', {
          pincode: address.pincode
        });
        setPincodeAvailable(res.data);
      } catch (error) {
        console.error('Error checking pincode:', error);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await reverseGeocode(latitude, longitude);
      },
      (error) => {
        setGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please enable location permissions.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location information unavailable.');
        } else {
          toast.error('Error getting location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Try using Google Maps Geocoding API if available
      const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (GOOGLE_MAPS_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components;
          
          let street = '';
          let city = '';
          let state = '';
          let pincode = '';
          let houseNo = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) {
              houseNo = component.long_name;
            } else if (types.includes('route')) {
              street = component.long_name;
            } else if (types.includes('locality') || types.includes('sublocality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (types.includes('postal_code')) {
              pincode = component.long_name;
            }
          });
          
          // If city not found, try sublocality or neighborhood
          if (!city) {
            const cityComponent = addressComponents.find(c => 
              c.types.includes('sublocality') || c.types.includes('neighborhood')
            );
            if (cityComponent) city = cityComponent.long_name;
          }
          
          setAddressForm({
            ...addressForm,
            houseNo: houseNo || '',
            street: street || result.formatted_address.split(',')[0] || '',
            city: city || '',
            state: state || '',
            pincode: pincode || ''
          });
          
          setShowAddressOptions(false);
          setShowAddressForm(true);
          setEditingAddress(null);
          setGettingLocation(false);
          toast.success('Location detected! Please review and complete the form.');
          return;
        }
      }
      
      // Fallback to OpenStreetMap Nominatim (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        setAddressForm({
          ...addressForm,
          houseNo: addr.house_number || addr.house || '',
          street: addr.road || addr.street || addr.pedestrian || '',
          city: addr.city || addr.town || addr.village || addr.municipality || '',
          state: addr.state || '',
          pincode: addr.postcode || ''
        });
        
        setShowAddressOptions(false);
        setShowAddressForm(true);
        setEditingAddress(null);
        setGettingLocation(false);
        toast.success('Location detected! Please review and complete the form.');
      } else {
        throw new Error('Unable to get address from location');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setGettingLocation(false);
      toast.error('Failed to get address from location. Please enter manually.');
    }
  };

  const handleManualEntry = () => {
    setShowAddressOptions(false);
    setShowAddressForm(true);
    setEditingAddress(null);
    // Reset form to default
    setAddressForm({
      fullName: user?.name || '',
      mobileNumber: '',
      houseNo: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home'
    });
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.fullName,
      mobileNumber: address.mobileNumber,
      houseNo: address.houseNo,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.addressType
    });
    setShowAddressForm(true);
    setShowAddressOptions(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await axios.delete(`/addresses/${id}`);
      const updatedAddresses = addresses.filter(a => a._id !== id);
      setAddresses(updatedAddresses);
      
      // If deleted address was selected, select another one or clear selection
      if (selectedAddress === id) {
        if (updatedAddresses.length > 0) {
          const defaultAddress = updatedAddresses.find(a => a.isDefault);
          setSelectedAddress(defaultAddress ? defaultAddress._id : updatedAddresses[0]._id);
        } else {
          setSelectedAddress('');
        }
      }
      
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        // Update existing address
        const res = await axios.put(`/addresses/${editingAddress._id}`, addressForm);
        const updatedAddresses = addresses.map(a => 
          a._id === editingAddress._id ? res.data : a
        );
        setAddresses(updatedAddresses);
        setSelectedAddress(res.data._id);
        toast.success('Address updated');
      } else {
        // Create new address
        const res = await axios.post('/addresses', addressForm);
        setAddresses([...addresses, res.data]);
        setSelectedAddress(res.data._id);
        toast.success('Address added');
      }
      
      setShowAddressForm(false);
      setShowAddressOptions(false);
      setEditingAddress(null);
      setAddressForm({
        fullName: '',
        mobileNumber: '',
        houseNo: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        addressType: 'Home'
      });
    } catch (error) {
      toast.error(editingAddress ? 'Failed to update address' : 'Failed to add address');
    }
  };

  const handleCouponApply = async () => {
    if (!couponCode) return;
    try {
      const res = await axios.post('/coupons/verify', {
        code: couponCode,
        amount: getTotal()
      });
      setDiscount(res.data.discount);
      toast.success('Coupon applied');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select an address');
      return;
    }

    if (!pincodeAvailable?.available) {
      toast.error('Delivery not available for selected address');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          weight: item.weight,
          isEggless: item.isEggless,
          quantity: item.quantity,
          price: item.price
        })),
        addressId: selectedAddress,
        couponCode: couponCode || '',
        paymentMethod,
        deliveryDate: cartItems[0].deliveryDate,
        deliveryTime: cartItems[0].deliveryTime
      };

      if (paymentMethod === 'Razorpay') {
        // Create Razorpay order
        const paymentRes = await axios.post('/payments/create-order', {
          amount: getTotal() - discount
        });

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: paymentRes.data.amount,
            currency: 'INR',
            name: 'BakeHub',
            description: 'Order Payment',
            order_id: paymentRes.data.orderId,
            handler: async (response) => {
              try {
                const verifyRes = await axios.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });

                if (verifyRes.data.verified) {
                  orderData.razorpayOrderId = verifyRes.data.razorpayOrderId;
                  orderData.razorpayPaymentId = verifyRes.data.razorpayPaymentId;
                  await createOrder(orderData);
                }
              } catch (error) {
                toast.error('Payment verification failed');
                setLoading(false);
              }
            },
            prefill: {
              name: user.name || '',
              email: user.email,
              contact: addresses.find(a => a._id === selectedAddress)?.mobileNumber || ''
            },
            theme: {
              color: '#f97316'
            }
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
          setLoading(false);
        };
        document.body.appendChild(script);
      } else {
        await createOrder(orderData);
      }
    } catch (error) {
      toast.error('Failed to place order');
      setLoading(false);
    }
  };

  const createOrder = async (orderData) => {
    try {
      await axios.post('/orders', orderData);
      clearCart();
      toast.success('Order placed successfully');
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  const subtotal = getTotal();
  const total = subtotal - discount;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

            {addresses.length > 0 && (
              <div className="space-y-2 mb-4">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`block p-4 border rounded-lg ${
                      selectedAddress === address._id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selectedAddress === address._id}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{address.fullName}</p>
                        <p className="text-sm text-gray-600">{address.mobileNumber}</p>
                        <p className="text-sm text-gray-600">
                          {address.houseNo}, {address.street}, {address.city}, {address.state} - {address.pincode}
                        </p>
                        <span className="text-xs text-gray-500">{address.addressType}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(address);
                          }}
                          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                          title="Edit address"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(address._id);
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                          title="Delete address"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showAddressForm && !showAddressOptions ? (
              <button
                onClick={() => setShowAddressOptions(true)}
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
              >
                + Add New Address
              </button>
            ) : showAddressOptions && !showAddressForm ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">Choose how you want to add address:</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleManualEntry}
                    className="flex-1 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium transition-colors"
                  >
                    📝 Manual Entry
                  </button>
                  <button
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="flex-1 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gettingLocation ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></span>
                        Getting Location...
                      </span>
                    ) : (
                      '📍 Use Current Location'
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setShowAddressOptions(false)}
                  className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold mb-2">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={addressForm.mobileNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                    required
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  placeholder="House/Flat No"
                  value={addressForm.houseNo}
                  onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Street/Area"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                    required
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <select
                  value={addressForm.addressType}
                  onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setShowAddressOptions(false);
                      setEditingAddress(null);
                      setAddressForm({
                        fullName: '',
                        mobileNumber: '',
                        houseNo: '',
                        street: '',
                        city: '',
                        state: '',
                        pincode: '',
                        addressType: 'Home'
                      });
                    }}
                    className="px-6 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {pincodeAvailable && (
              <div className={`mt-4 p-3 rounded ${pincodeAvailable.available ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {pincodeAvailable.available ? '✅' : '❌'} {pincodeAvailable.message}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span>Cash on Delivery</span>
              </label>
              {/* <label className="flex items-center p-4 border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="Razorpay"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span>Razorpay (Online Payment)</span>
              </label> */}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex flex-col gap-0.5 mb-2">
                  <div className="flex justify-between text-sm items-center">
                    <span className="flex items-center gap-2">
                      {item.name} x{item.quantity}
                      {item.isPreOrder && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Pre-order</span>
                      )}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                  {item.isPreOrder ? (
                    <span className="text-xs text-blue-700 ml-1">Estimated delivery: {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : (item.preOrderDeliveryDate ? new Date(item.preOrderDeliveryDate).toLocaleDateString() : 'TBA')}</span>
                  ) : null}
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              {/* Coupon */}
              <div className="border-t pt-2">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={handleCouponApply}
                    className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Apply
                  </button>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || !pincodeAvailable?.available || !selectedAddress}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

