
import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal, placeOrder, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
      if (!user) {
          navigate('/login');
          return;
      }
      setIsPlacingOrder(true);
      const success = await placeOrder();
      setIsPlacingOrder(false);
      if (success) {
          navigate('/orders');
      } else {
          alert('There was an error placing your order. Please try again.');
      }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <Link to="/" className="text-indigo-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between border-b py-4 last:border-b-0">
                    <div className="flex items-center">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-20 object-cover rounded-md mr-4" />
                        <div>
                            <Link to={`/product/${item.product.id}`} className="font-semibold hover:text-indigo-600">{item.product.name}</Link>
                            <p className="text-gray-500 text-sm">${item.product.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value, 10))}
                            className="w-16 p-1 border rounded-md text-center"
                        />
                         <span className="font-semibold w-24 text-right">${(item.product.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-gray-500 hover:text-red-600">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h2>
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>FREE</span>
                </div>
                 <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                </div>
            </div>
            <button 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full bg-indigo-600 text-white mt-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
            >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order (COD)'}
            </button>
            {!user && <p className="text-sm text-center mt-2">You need to <Link to="/login" className="text-indigo-600 underline">login</Link> to place an order.</p>}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
