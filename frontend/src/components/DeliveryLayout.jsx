import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const DeliveryLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/delivery" className="text-xl font-bold text-primary-600">
              <span className="flex items-center gap-2"><img src={logo} alt="Logo" className="h-12 w-auto object-contain inline" /> Delivery</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <Link
            to="/delivery"
            className={`px-4 py-2 rounded-lg ${
              location.pathname === '/delivery'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/delivery/orders"
            className={`px-4 py-2 rounded-lg ${
              location.pathname === '/delivery/orders'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Orders
          </Link>
        </div>
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DeliveryLayout;

