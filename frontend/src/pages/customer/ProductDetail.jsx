import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [isEggless, setIsEggless] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPreOrderDate, setSelectedPreOrderDate] = useState('');
  const [selectedPreOrderTime, setSelectedPreOrderTime] = useState('09:00-12:00');

  useEffect(() => {
    fetchProduct();
    // Scroll to top on mobile when product detail mounts
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [id]);

  useEffect(() => {
    // Set default weight option when product loads
    if (product && product.weightOptions && product.weightOptions.length > 0) {
      const defaultWeight = product.weightOptions[0];
      setSelectedWeight(defaultWeight.weight);
      setSelectedPrice(defaultWeight.price);
      setIsEggless(product.isEggless || false);
    } else if (product && product.price) {
      setSelectedPrice(product.price);
      setIsEggless(product.isEggless || false);
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (weight) => {
    const weightOption = product.weightOptions.find(w => w.weight === weight);
    if (weightOption) {
      setSelectedWeight(weight);
      setSelectedPrice(weightOption.price);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validate weight selection for products with weight options
    if (product.weightOptions && product.weightOptions.length > 0 && !selectedWeight) {
      toast.error('Please select a weight option');
      return;
    }

    let deliveryDate, deliveryTime;
    if (isPreOrder) {
      if (!selectedPreOrderDate) {
        toast.error('Please select your preferred delivery date');
        return;
      }
      if (!selectedPreOrderTime) {
        toast.error('Please select your preferred delivery time');
        return;
      }
      deliveryDate = selectedPreOrderDate;
      deliveryTime = selectedPreOrderTime;
    } else {
      // Set default delivery date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      deliveryDate = tomorrow.toISOString().split('T')[0];
      deliveryTime = '09:00-12:00';
    }

    const weight = selectedWeight || 'Standard';
    const price = selectedPrice || product.price;

    const cartItem = {
      productId: product._id,
      name: product.name,
      weight: weight,
      isEggless: isEggless,
      price: price,
      image: product.images?.[0] || '',
      deliveryDate,
      deliveryTime,
      isPreOrder,
      preOrderDeliveryDate: product.preOrderDeliveryDate || null
    };

    try {
      // Add to cart quantity times
      for (let i = 0; i < quantity; i++) {
        addToCart(cartItem);
      }
      toast.success(`Added ${quantity} item(s) to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasWeightOptions = product.weightOptions && product.weightOptions.length > 0;
  const isPreOrder = product.isPreOrder;
  const preOrderDeliveryDate = product.preOrderDeliveryDate ? new Date(product.preOrderDeliveryDate).toLocaleDateString() : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/products"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            {images.length > 0 ? (
              <img
                src={getImageUrl(images[selectedImageIndex])}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                <span className="text-9xl">🍰</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`border-2 rounded-lg overflow-hidden ${
                    selectedImageIndex === index ? 'border-primary-600' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          {product.category && (
            <p className="text-gray-500 mb-4">{product.category.name}</p>
          )}

          {/* Pre-order Message */}
          {isPreOrder && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
              <strong>This product is available for pre-order.</strong>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-primary-600">
              ₹{selectedPrice || product.price}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Weight Options */}
          {hasWeightOptions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Weight</h3>
              <div className="flex gap-3">
                {product.weightOptions.map((option) => (
                  <button
                    key={option.weight}
                    onClick={() => handleWeightChange(option.weight)}
                    className={`px-6 py-3 rounded-lg border-2 font-semibold transition ${
                      selectedWeight === option.weight
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {option.weight}
                    <div className="text-sm mt-1">₹{option.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Egg/Eggless Option */}
          {product.hasEggOption && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Egg Option</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEggless(false)}
                  className={`px-6 py-3 rounded-lg border-2 font-semibold transition ${
                    !isEggless
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  With Egg
                </button>
                <button
                  onClick={() => setIsEggless(true)}
                  className={`px-6 py-3 rounded-lg border-2 font-semibold transition ${
                    isEggless
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  Eggless
                </button>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quantity</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={decreaseQuantity}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary-600 flex items-center justify-center font-semibold"
              >
                -
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={increaseQuantity}
                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-primary-600 flex items-center justify-center font-semibold"
              >
                +
              </button>
            </div>
          </div>

          {/* Stock Status or Pre-order */}
          {isPreOrder ? (
            <div className="mb-6">
              <span className="text-blue-600 font-semibold">Pre-order available</span>
              {/* Customer chooses estimated delivery date and time */}
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2 text-blue-700">Choose your preferred delivery date:</label>
                <input
                  type="date"
                  min={product.preOrderAvailableDate ? product.preOrderAvailableDate.slice(0, 10) : ''}
                  max={product.preOrderDeliveryDate ? product.preOrderDeliveryDate.slice(0, 10) : ''}
                  value={selectedPreOrderDate}
                  onChange={e => setSelectedPreOrderDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                />
                {selectedPreOrderDate && (
                  <div className="text-xs text-blue-700 mt-1">Selected: {new Date(selectedPreOrderDate).toLocaleDateString()}</div>
                )}
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2 text-blue-700">Choose your preferred delivery time:</label>
                <select
                  value={selectedPreOrderTime}
                  onChange={e => setSelectedPreOrderTime(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="09:00-12:00">09:00-12:00</option>
                  <option value="12:00-15:00">12:00-15:00</option>
                  <option value="15:00-18:00">15:00-18:00</option>
                  <option value="18:00-21:00">18:00-21:00</option>
                </select>
                {selectedPreOrderTime && (
                  <div className="text-xs text-blue-700 mt-1">Selected: {selectedPreOrderTime}</div>
                )}
              </div>
            </div>
          ) : product.stock !== undefined && (
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="text-green-600 font-semibold">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              )}
            </div>
          )}

          {/* Add to Cart & Pre-order Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition"
            >
              Add to Cart
            </button>
            {isPreOrder && (
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition"
              >
                Pre-order Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
