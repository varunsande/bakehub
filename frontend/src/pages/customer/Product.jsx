import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const Product = () => {
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

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
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

  // ✅ FIXED API PATH (/api added)
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

    if (product.weightOptions && product.weightOptions.length > 0 && !selectedWeight) {
      toast.error('Please select a weight option');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deliveryDate = tomorrow.toISOString().split('T')[0];
    const deliveryTime = '09:00-12:00';

    const weight = selectedWeight || 'Standard';
    const price = selectedPrice || product.price;

    const cartItem = {
      productId: product._id,
      name: product.name,
      weight,
      isEggless,
      price,
      image: product.images?.[0] || '',
      deliveryDate,
      deliveryTime
    };

    try {
      for (let i = 0; i < quantity; i++) {
        addToCart(cartItem);
      }
      toast.success(`Added ${quantity} item(s) to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        ← Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
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
                  className={`border-2 rounded-lg ${
                    selectedImageIndex === index
                      ? 'border-primary-600'
                      : 'border-gray-300'
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt=""
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="mb-4">
            <span className="text-3xl font-bold text-primary-600">
              ₹{selectedPrice || product.price}
            </span>
          </div>

          {hasWeightOptions && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Select Weight</h3>
              <div className="flex gap-3">
                {product.weightOptions.map((option) => (
                  <button
                    key={option.weight}
                    onClick={() => handleWeightChange(option.weight)}
                    className={`px-4 py-2 border rounded ${
                      selectedWeight === option.weight
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {option.weight} – ₹{option.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Quantity</h3>
            <div className="flex items-center gap-4">
              <button onClick={decreaseQuantity}>-</button>
              <span>{quantity}</span>
              <button onClick={increaseQuantity}>+</button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-primary-600 text-white rounded-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
