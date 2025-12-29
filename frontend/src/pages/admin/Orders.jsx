import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [ordersRes, deliveryBoysRes] = await Promise.all([
        axios.get(`/orders/admin/all?${statusFilter ? `status=${statusFilter}` : ''}`),
        axios.get('/admin/delivery-boys')
      ]);
      setOrders(ordersRes.data.orders || ordersRes.data);
      setDeliveryBoys(deliveryBoysRes.data.filter(db => db.isActive));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignDeliveryBoy = async (orderId, deliveryBoyId) => {
    try {
      await axios.put(`/orders/${orderId}/assign-delivery`, { deliveryBoyId });
      if (deliveryBoyId) {
        toast.success('Delivery boy assigned successfully');
      } else {
        toast.success('Delivery boy assignment removed');
      }
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to assign delivery boy';
      toast.error(errorMessage);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { orderStatus: status });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Preparing">Preparing</option>
          <option value="Assigned to Delivery Boy">Assigned</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  Order #{order._id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">
                  Customer: {order.userId?.name || order.userId?.email}
                </p>
                <p className="text-sm text-gray-600">
                  Total: ₹{order.total}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryDate && (
                    <>Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}{order.deliveryTime ? ` at ${order.deliveryTime}` : ''}</>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-2">{order.orderStatus}</p>
                <select
                  value={order.orderStatus}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Assigned to Delivery Boy">Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Items</h4>
              {order.items.map((item, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {item.name} - {item.weight} x{item.quantity}
                </div>
              ))}
            </div>

            {order.addressId && (
              <div className="mb-4 text-sm">
                <p className="font-semibold">Address:</p>
                <p className="text-gray-600">
                  {order.addressId.fullName}, {order.addressId.mobileNumber}
                </p>
                <p className="text-gray-600">
                  {order.addressId.houseNo}, {order.addressId.street}, {order.addressId.city}, {order.addressId.state} - {order.addressId.pincode}
                </p>
              </div>
            )}

            <div className="mb-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    {order.deliveryBoyId ? 'Delivery Boy Assigned' : 'Assign Delivery Boy'}
                  </label>
                  {(order.orderStatus === 'Pending' || order.orderStatus === 'Preparing' || order.orderStatus === 'Assigned to Delivery Boy' || order.orderStatus === 'Picked Up') ? (
                    <div className="flex items-center gap-4">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignDeliveryBoy(order._id, e.target.value);
                          } else if (order.deliveryBoyId && e.target.value === '') {
                            // Allow clearing assignment
                            if (window.confirm('Remove delivery boy assignment?')) {
                              assignDeliveryBoy(order._id, '');
                            }
                          }
                        }}
                        className="px-4 py-2 border rounded-lg w-full max-w-md"
                        value={order.deliveryBoyId?._id || ''}
                      >
                        <option value="">{order.deliveryBoyId ? '-- Remove Assignment --' : 'Select delivery boy'}</option>
                        {deliveryBoys.length > 0 ? (
                          deliveryBoys.map((db) => (
                            <option key={db._id} value={db._id}>
                              {db.name} - {db.mobileNumber}
                              {db.vehicleType ? ` (${db.vehicleType})` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No active delivery boys available</option>
                        )}
                      </select>
                      {order.deliveryBoyId && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{order.deliveryBoyId.name}</span>
                          <span className="ml-2">({order.deliveryBoyId.mobileNumber})</span>
                          {order.deliveryBoyId.vehicleType && (
                            <span className="text-gray-500 ml-2">• {order.deliveryBoyId.vehicleType}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : order.deliveryBoyId ? (
                    <div className="text-sm">
                      <span className="font-medium">{order.deliveryBoyId.name}</span>
                      <span className="text-gray-600 ml-2">({order.deliveryBoyId.mobileNumber})</span>
                      {order.deliveryBoyId.vehicleType && (
                        <span className="text-gray-500 ml-2">• {order.deliveryBoyId.vehicleType}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No delivery boy assigned</p>
                  )}
                </div>
              </div>
              {(order.orderStatus === 'Pending' || order.orderStatus === 'Preparing') && !order.deliveryBoyId && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Assign a delivery boy before changing status to "Assigned to Delivery Boy"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;

