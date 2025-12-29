import { useState } from 'react';
import logo from '../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Mobile: Logo + Icons */}
          <div className="flex items-center justify-between w-full sm:hidden">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logo} alt="BakeHub Logo" className="h-14 w-auto object-contain" />
            </Link>
            {/* Icon Group */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <Link to="/cart" className="relative group">
                <svg className="w-7 h-7 text-gray-700 group-hover:text-primary-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              {/* Profile */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 focus:outline-none"
                    aria-label="Profile menu"
                  >
                    <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-primary-200 shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-fade-in">
                      <Link
                        to="/profile"
                        className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/addresses"
                        className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Addresses
                      </Link>
                      {user.role === 'superAdmin' && (
                        <Link
                          to="/admin"
                          className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      {user.role === 'deliveryBoy' && (
                        <Link
                          to="/delivery"
                          className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Delivery Boy Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-full font-semibold shadow hover:bg-primary-700 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
          {/* PC: Original layout */}
          <div className="hidden sm:flex flex-row items-center justify-between w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logo} alt="BakeHub Logo" className="h-14 w-auto object-contain" />
            </Link>
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full sm:w-auto flex-1 max-w-lg mx-0 sm:mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search cakes & sweets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
            {/* Icon Group */}
            <div className="flex items-center gap-4">
              {/* Cart */}
              <Link to="/cart" className="relative group">
                <svg className="w-7 h-7 text-gray-700 group-hover:text-primary-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              {/* Profile */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 focus:outline-none"
                    aria-label="Profile menu"
                  >
                    <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-primary-200 shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-fade-in">
                      <Link
                        to="/profile"
                        className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/addresses"
                        className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        My Addresses
                      </Link>
                      {user.role === 'superAdmin' && (
                        <Link
                          to="/admin"
                          className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      {user.role === 'deliveryBoy' && (
                        <Link
                          to="/delivery"
                          className="block px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          Delivery Boy Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-full font-semibold shadow hover:bg-primary-700 transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
          {/* Mobile: Search Bar below */}
          <form onSubmit={handleSearch} className="w-full sm:hidden mt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cakes & sweets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;

