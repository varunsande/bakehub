import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// Customer routes
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import Profile from './pages/customer/Profile';
import Addresses from './pages/customer/Addresses';
import Login from './pages/auth/Login';

// Delivery Boy routes
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryOrders from './pages/delivery/Orders';

// Admin routes
import AdminDashboard from './pages/admin/Dashboard';
import AdminCategories from './pages/admin/Categories';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminDeliveryBoys from './pages/admin/DeliveryBoys';
import AdminCustomers from './pages/admin/Customers';
import AdminBanners from './pages/admin/Banners';
import AdminCoupons from './pages/admin/Coupons';
import AdminPincodes from './pages/admin/Pincodes';

import Layout from './components/Layout';
import DeliveryLayout from './components/DeliveryLayout';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
        <Toaster position="top-right" />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Customer routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route
              path="checkout"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="addresses"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Addresses />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Delivery Boy routes */}
          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['deliveryBoy']}>
                <DeliveryLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="delivery-boys" element={<AdminDeliveryBoys />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="pincodes" element={<AdminPincodes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

