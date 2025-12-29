import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import PincodeCheck from '../../components/PincodeCheck';
import { useState } from 'react';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [pincodeAvailable, setPincodeAvailable] = useState(null);

  // Check if any pre-order item is missing delivery date
  const missingEstimatedDelivery = cartItems.some(
    (item) => item.isPreOrder && !item.deliveryDate
  );

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="mb-6">
        <PincodeCheck onCheckResult={setPincodeAvailable} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className="p-4 border-b last:border-b-0 flex items-center gap-4"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {item.name}
                    {item.isPreOrder && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Pre-order</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.weight} {item.isEggless && '• Eggless'}
                  </p>
                      {item.isPreOrder ? (
                        <div className="text-sm text-blue-700 flex flex-col gap-1">
                          <span>Estimated delivery:</span>
                          <input
                            type="date"
                            min={item.preOrderAvailableDate ? item.preOrderAvailableDate.slice(0, 10) : ''}
                            max={item.preOrderDeliveryDate ? item.preOrderDeliveryDate.slice(0, 10) : ''}
                            value={item.deliveryDate || ''}
                            onChange={e => updateQuantity(item.productId, item.weight, item.isEggless, item.quantity, e.target.value)}
                            className="px-2 py-1 border rounded w-40"
                          />
                          {item.deliveryDate && (
                            <span className="text-xs mt-1">Selected: {new Date(item.deliveryDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Delivery: {item.deliveryDate} {item.deliveryTime}
                        </p>
                      )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.weight, item.isEggless, item.quantity - 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.weight, item.isEggless, item.quantity + 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold w-20 text-right">₹{item.price * item.quantity}</p>
                  <button
                    onClick={() => removeFromCart(item.productId, item.weight, item.isEggless)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{subtotal}</span>
              </div>
            </div>


            {(!pincodeAvailable?.available || missingEstimatedDelivery) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                {!pincodeAvailable?.available
                  ? 'Please check delivery availability before checkout'
                  : 'Please select Estimated delivery date for all pre-order items to proceed.'}
              </div>
            )}

            <Link
              to="/checkout"
              className={`block w-full text-center px-6 py-3 rounded-lg font-semibold ${
                pincodeAvailable?.available && !missingEstimatedDelivery
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={(e) => {
                if (!pincodeAvailable?.available || missingEstimatedDelivery) {
                  e.preventDefault();
                }
              }}
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

