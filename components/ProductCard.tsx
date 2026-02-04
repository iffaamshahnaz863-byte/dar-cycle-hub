
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { addToCart } = useCart();
  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <Link to={`/product/${product.id}`}>
        <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
      </Link>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 truncate">
          <Link to={`/product/${product.id}`} className="hover:text-indigo-600">{product.name}</Link>
        </h3>
        <p className="text-gray-600 text-sm mb-3 h-10 overflow-hidden">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-800">${product.price.toFixed(2)}</span>
          <button 
            onClick={() => addToCart(product, 1)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <ShoppingCart className="w-4 h-4 mr-2"/>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
