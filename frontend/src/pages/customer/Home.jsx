import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Banner from '../../components/Banner';
import CategoryCard from '../../components/CategoryCard';
import ProductCard from '../../components/ProductCard';
import PincodeCheck from '../../components/PincodeCheck';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const Home = () => {
    // Scroll to top on mount for mobile devices
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, []);
  const [categories, setCategories] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const autoplayRef = useRef();
    // Autoplay effect for banners
    useEffect(() => {
      if (banners.length <= 1) return;
      let paused = false;
      const play = () => {
        if (!paused) {
          setCurrentBanner((prev) => (prev + 1) % banners.length);
        }
      };
      autoplayRef.current = setInterval(play, 2500);
      return () => clearInterval(autoplayRef.current);
    }, [banners]);

    // Pause on hover handlers
    const handleBannerMouseEnter = () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
    const handleBannerMouseLeave = () => {
      if (banners.length > 1) {
        autoplayRef.current = setInterval(() => {
          setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 2500);
      }
    };
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, bestsellersRes, bannersRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/products/bestsellers'),
        axios.get('/api/banners')
      ]);

      setCategories(categoriesRes.data);
      setBestsellers(bestsellersRes.data);
      setBanners(bannersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      {/* Hero Section */}
      <section className="bg-[#fffaf5] py-14 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#fbeaec] rounded-2xl shadow border border-[#f8d6d6] text-[#a14d5a] font-semibold text-base">
                <span className="inline-block w-3 h-3 bg-[#c23b5a] rounded-full"></span>
                Freshly baked every morning
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-[#7a5432]">
                Taste the <span className="text-[#ff9800]">Magic</span> in Every Bite
              </h1>

              {/* Description */}
              <p className="text-xl text-[#a78b6c] leading-relaxed max-w-xl">
                Premium handcrafted cakes, pastries, and artisanal breads delivered straight to your doorstep. Made with love and the finest ingredients.
              </p>

              {/* Pincode Check */}
              <div className="pt-2">
                <PincodeCheck />
              </div>
            </div>

            {/* Right Column - Admin Banner Image */}
            <div className="relative flex justify-center items-center">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-0">
                {banners.length > 0 && banners[currentBanner] && banners[currentBanner].image ? (
                  <img
                    src={getImageUrl(banners[currentBanner].image)}
                    alt={banners[currentBanner].title || 'Homepage Banner'}
                    className="w-[480px] h-[380px] object-cover rounded-3xl transition-all duration-700"
                    onMouseEnter={handleBannerMouseEnter}
                    onMouseLeave={handleBannerMouseLeave}
                  />
                ) : (
                  <div className="w-[480px] h-[380px] bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center rounded-3xl">
                    <span className="text-amber-700 text-lg">No Banner Image</span>
                  </div>
                )}
                {/* Banner navigation dots */}
                {banners.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-3 h-3 rounded-full border border-white ${idx === currentBanner ? 'bg-white' : 'bg-gray-400 opacity-60'}`}
                        style={{ transition: 'background 0.3s' }}
                        onClick={() => setCurrentBanner(idx)}
                        aria-label={`Go to banner ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banners removed as requested */}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <h2 className="text-3xl font-extrabold mb-7 text-primary-800 tracking-tight">Shop by Categories</h2>
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category._id} category={category} />
          ))}
        </div>
      </section>

      {/* Best Sellers - Redesigned */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16" style={{background:'#faf6f1', borderRadius:'2rem'}}>
        <div className="mb-2">
          <div className="uppercase text-[#a14d5a] font-bold text-sm mb-1 tracking-wider">Favorites</div>
          <h2 className="text-4xl font-extrabold text-[#7a5432] mb-2 text-left">Best Sellers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-8">
          {bestsellers.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        <div className="flex justify-end mt-8">
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-3 border border-[#7a5432] rounded-lg text-[#7a5432] font-bold text-xl hover:bg-[#f3e9de] transition"
          >
            View All <span className="ml-2">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

