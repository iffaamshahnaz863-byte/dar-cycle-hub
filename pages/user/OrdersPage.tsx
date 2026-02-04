
import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { getUserOrders } from '../../services/mockApi';
import { useAuth } from '../../contexts/AuthContext';

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  const statusClasses = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Processing: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-green-100 text-green-800',
    Delivered: 'bg-purple-100 text-purple-800',
    Cancelled: 'bg-red-100 text-red-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoading(true);
        const data = await getUserOrders(user.id);
        setOrders(data);
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return <div className="text-center py-10">Loading your orders...</div>;
  }

  if (orders.length === 0) {
      return (
          <div className="text-center py-10">
              <h1 className="text-3xl font-bold mb-4">No Orders Found</h1>
              <p className="text-gray-600">You haven't placed any orders yet.</p>
          </div>
      );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start border-b pb-4 mb-4">
              <div>
                <p className="font-bold text-lg">Order #{order.id}</p>
                <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
            <div>
              {order.items.map(item => (
                <div key={item.id} className="flex items-center py-2">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded mr-4" />
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity} - ${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
