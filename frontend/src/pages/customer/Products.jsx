import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../../components/ProductCard';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchData();
    // Scroll to top on mobile when category changes
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory ? `?category=${selectedCategory}` : '';
      const response = await axios.get(`/products${categoryParam}`);
      setProducts(response.data);
      
      // Fetch categories for filter
      const categoriesRes = await axios.get('/categories');
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Products</h1>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCategoryFilter('')}
              className={`px-4 py-2 rounded-lg border-2 transition ${
                !selectedCategory
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryFilter(category.name)}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  selectedCategory === category.name
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
        </div>
      )}
    </div>
  );
};

export default Products;


