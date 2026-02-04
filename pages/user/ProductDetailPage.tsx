
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { getProductById } from '../../services/mockApi';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (id) {
        setLoading(true);
        const data = await getProductById(Number(id));
        if (data) {
          setProduct(data);
        } else {
          // Handle not found, maybe redirect
          navigate('/');
        }
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Maybe show a notification
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading product...</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Product not found.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img src={product.imageUrl} alt={product.name} className="w-full h-auto object-cover rounded-lg" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-3xl font-bold text-indigo-600 mb-6">${product.price.toFixed(2)}</p>
          
          <div className="flex items-center space-x-4 mb-6">
            <label htmlFor="quantity" className="font-semibold">Quantity:</label>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1" 
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 border-gray-300 border rounded-md p-2 text-center"
            />
          </div>

          <button 
            onClick={handleAddToCart}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
