
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Thank You For Your Order!</h1>
      <p className="text-lg text-gray-600 mb-2">Your order has been placed successfully.</p>
      {orderId && (
        <p className="text-gray-600 mb-8">
          Your Order ID is: <span className="font-semibold text-indigo-600">#{orderId}</span>
        </p>
      )}
      <div className="flex space-x-4">
        <Link 
          to="/orders" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          View My Orders
        </Link>
        <Link 
          to="/" 
          className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
