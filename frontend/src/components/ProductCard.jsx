
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  if (img.startsWith('/uploads')) return BACKEND_URL + img;
  return `${BACKEND_URL}/uploads/${img}`;
};

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const minPrice = product.weightOptions?.length > 0
    ? Math.min(...product.weightOptions.map(w => w.price))
    : product.price;

  const isPreOrder = product.isPreOrder;
  const preOrderDeliveryDate = product.preOrderDeliveryDate ? new Date(product.preOrderDeliveryDate).toLocaleDateString() : null;
  return (
    <div
      className="bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transform scale-95 transition-all duration-300 hover:scale-93 hover:shadow-2xl cursor-pointer group"
      style={{ minHeight: 420 }}
      onClick={() => navigate(`/products/${product._id}`)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${product.name}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { navigate(`/products/${product._id}`); } }}
    >
      {/* Image */}
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {isPreOrder && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10">Pre-order</span>
        )}
        {product.images && product.images.length > 0 ? (
          <img
            src={getImageUrl(product.images[0])}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110"
            onError={e => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
          />
        ) : (
          <span className="text-6xl">🍰</span>
        )}
      </div>
      {/* Card Content */}
      <div className="flex-1 flex flex-col justify-between p-6">
        {/* Rating */}
        <div className="flex items-center mb-2">
          <span className="text-amber-500 mr-1 text-lg">★</span>
          <span className="text-gray-700 font-medium text-base">{product.rating ? product.rating.toFixed(1) : '4.5'}</span>
        </div>
        {/* Name */}
        <h3 className="font-bold text-gray-800 text-xl mb-1 text-left">{product.name}</h3>
        {/* Description */}
        <p className="text-gray-500 text-left text-base mb-4 line-clamp-2">{product.description || 'Delicious cake for every occasion.'}</p>
        {/* Pre-order message */}
        {isPreOrder && (
          <div className="mb-2 text-blue-700 text-xs font-semibold">
            Pre-order now!{preOrderDeliveryDate && (
              <span> Estimated delivery: <b>{preOrderDeliveryDate}</b></span>
            )}
          </div>
        )}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-200">
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-400 font-bold tracking-widest mb-1">PRICE</span>
            <span className="text-xl font-extrabold text-[#7a5432]">₹{minPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full border border-[#7a5432] text-[#7a5432] hover:bg-[#f3e9de] transition text-base ml-2"
            aria-label={isPreOrder ? 'Pre-order now' : 'Add to cart'}
            tabIndex={-1}
            type="button"
            onClick={e => {
              e.stopPropagation();
              addToCart({
                productId: product._id,
                name: product.name,
                price: minPrice,
                image: product.images && product.images[0],
                weight: product.weightOptions && product.weightOptions[0]?.weight,
                isEggless: product.isEggless || false,
                isPreOrder: isPreOrder,
                preOrderDeliveryDate: product.preOrderDeliveryDate || null
              });
            }}
            disabled={!isPreOrder && product.stock === 0}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

