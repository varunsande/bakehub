import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Banner from '../../components/Banner';
import CategoryCard from '../../components/CategoryCard';
import ProductCard from '../../components/ProductCard';
import PincodeCheck from '../../components/PincodeCheck';

const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

  const autoplayRef = useRef(null);

  // Scroll to top on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Banner autoplay
  useEffect(() => {
    if (!Array.isArray(banners) || banners.length <= 1) return;

    autoplayRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 2500);

    return () => clearInterval(autoplayRef.current);
  }, [banners]);

  const fetchData = async () => {
    try {
      const [categoriesRes, bestsellersRes, bannersRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/products/bestsellers'),
        axios.get('/api/banners')
      ]);

      setCategories(
        Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.data || []
      );

      setBestsellers(
        Array.isArray(bestsellersRes.data)
          ? bestsellersRes.data
          : bestsellersRes.data?.data || []
      );

      setBanners(
        Array.isArray(bannersRes.data)
          ? bannersRes.data
          : bannersRes.data?.data || []
      );
    } catch (error) {
      console.error('Error fetching home data:', error);
      setCategories([]);
      setBestsellers([]);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <section className="bg-[#fffaf5] py-14 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* LEFT */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#fbeaec] rounded-2xl text-[#a14d5a] font-semibold">
                <span className="w-3 h-3 bg-[#c23b5a] rounded-full"></span>
                Freshly baked every morning
              </div>

              <h1 className="text-5xl font-extrabold text-[#7a5432]">
                Taste the <span className="text-[#ff9800]">Magic</span> in Every Bite
              </h1>

              <p className="text-xl text-[#a78b6c] max-w-xl">
                Premium handcrafted cakes, pastries, and artisanal breads delivered straight to your doorstep.
              </p>

              <PincodeCheck />
            </div>

            {/* RIGHT – BANNER */}
            <div className="relative">
              {Array.isArray(banners) && banners.length > 0 ? (
                <img
                  src={getImageUrl(banners[currentBanner]?.image)}
                  alt="Banner"
                  className="w-[480px] h-[380px] object-cover rounded-3xl shadow-xl"
                />
              ) : (
                <div className="w-[480px] h-[380px] bg-yellow-200 flex items-center justify-center rounded-3xl">
                  No Banner
                </div>
              )}

              {Array.isArray(banners) && banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`w-3 h-3 rounded-full ${
                        idx === currentBanner ? 'bg-white' : 'bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <h2 className="text-3xl font-bold mb-6">Shop by Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.isArray(categories) &&
            categories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 bg-[#faf6f1] rounded-3xl">
        <h2 className="text-4xl font-extrabold mb-8 text-[#7a5432]">
          Best Sellers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {Array.isArray(bestsellers) &&
            bestsellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>

        <div className="flex justify-end mt-8">
          <Link
            to="/products"
            className="px-8 py-3 border border-[#7a5432] rounded-lg text-[#7a5432] font-bold hover:bg-[#f3e9de]"
          >
            View All →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
