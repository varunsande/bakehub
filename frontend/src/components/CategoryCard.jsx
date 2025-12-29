
import { Link } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  if (img.startsWith('/uploads')) return BACKEND_URL + img;
  return `${BACKEND_URL}/uploads/${img}`;
};

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.name)}`}
      className="block bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 text-center group"
    >
      {category.image ? (
        <img
          src={getImageUrl(category.image)}
          alt={category.name}
          className="w-full h-32 object-cover rounded-2xl mb-4 group-hover:scale-105 transition-transform"
          onError={e => { e.target.onerror = null; e.target.src = '/fallback.png'; }}
        />
      ) : (
        <div className="w-full h-32 bg-primary-100 rounded-2xl mb-4 flex items-center justify-center">
          <span className="text-4xl">🍰</span>
        </div>
      )}
      <h3 className="font-semibold text-gray-800">{category.name}</h3>
    </Link>
  );
};

export default CategoryCard;

