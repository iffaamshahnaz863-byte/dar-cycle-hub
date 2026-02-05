
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
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between group">
      {/* The top part of the card is a link to the product detail page. */}
      {/* This strictly separates navigation from other actions and is the idiomatic way to handle routing. */}
      <Link to={`/product/${product.id}`} className="block cursor-pointer">
        <div className="overflow-hidden">
          {/* Using a standard <img> tag ensures the image URL is never treated as a route. */}
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out" 
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1 truncate text-gray-800 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3 h-10 overflow-hidden">{product.description}</p>
        </div>
      </Link>
      
      {/* The bottom part contains actions that do not navigate. */}
      <div className="p-4 pt-0">
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-800">
             {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
          </span>
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