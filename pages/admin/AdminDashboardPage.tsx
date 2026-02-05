
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { getAllOrders, updateOrderStatus } from '../../services/mockApi';
import { AlertCircle } from 'lucide-react';

const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  const statusClasses: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.Processing]: 'bg-blue-100 text-blue-800',
    [OrderStatus.Shipped]: 'bg-green-100 text-green-800',
    [OrderStatus.Delivered]: 'bg-purple-100 text-purple-800',
    [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};


const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOrders({ signal });
      if (!signal?.aborted) {
        setOrders(data);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to fetch orders:", err);
        setError("Could not load orders. Please try refreshing.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);
  
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
        await updateOrderStatus(orderId, newStatus);
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
        console.error("Failed to update order status:", err);
        setError("Failed to update status. Please refresh and try again.");
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return (
       <div className="text-center py-20 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12" />
        <h3 className="mt-2 text-xl font-medium">An Error Occurred</h3>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">All Orders</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.userEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="p-1 border rounded-md"
                  >
                    {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage;