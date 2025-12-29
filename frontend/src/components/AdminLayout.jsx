import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/categories', label: 'Categories' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/delivery-boys', label: 'Delivery Boys' },
    { path: '/admin/customers', label: 'Customers' },
    { path: '/admin/banners', label: 'Banners' },
    { path: '/admin/coupons', label: 'Coupons' },
    { path: '/admin/pincodes', label: 'Pincodes' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/admin" className="text-xl font-bold text-primary-600">
              <span className="flex items-center gap-2"><img src={logo} alt="Logo" className="h-12 w-auto object-contain inline" /> Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
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
        <div className="flex flex-wrap gap-2 mb-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg ${
                location.pathname === item.path
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

