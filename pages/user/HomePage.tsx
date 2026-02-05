
import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { getProducts } from '../../services/mockApi';
import ProductCard from '../../components/ProductCard';
import { AlertCircle } from 'lucide-react';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts({ signal });
        if (!signal.aborted) {
          setProducts(data);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch products:", err);
          setError("Could not load products. Please try refreshing the page.");
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchProducts();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-3 animate-pulse"></div>
              <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12" />
        <h3 className="mt-2 text-xl font-medium">Failed to Load Products</h3>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Featured Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;