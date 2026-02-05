
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product } from '../../types';
import { getProductById, getProducts } from '../../services/mockApi';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, Star, Shield, Truck, RotateCw, Award, Zap, ChevronRight, AlertCircle } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchProductData = async () => {
      if (!id) {
        setLoading(false);
        setError("Product ID is missing.");
        return;
      }

      setLoading(true);
      setError(null);
      setProduct(null); // Reset product state on ID change

      try {
        const productData = await getProductById(id, { signal });
        
        if (signal.aborted) return;

        if (productData) {
          setProduct(productData);
          document.title = `${productData.name} | DAR CYCLE HUB`;
          // Fetch similar products after getting the main product
          const allProducts = await getProducts({ signal });
          if (signal.aborted) return;
          const related = allProducts.filter(p => p.category === productData.category && p.id !== productData.id).slice(0, 4);
          setSimilarProducts(related);
        } else {
            setProduct(null);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch product details:", err);
          setError("Could not load product details. It might not exist or there was a network issue.");
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    fetchProductData();

    return () => {
      controller.abort();
    };
  }, [id]);

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
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

  if (!product) {
    return <div className="text-center py-20 font-semibold text-xl">Product not found.</div>;
  }
  
  const isOutOfStock = product.stock === 0;

  return (
    <div className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
            <div className="text-sm text-gray-600 mb-4 flex items-center flex-wrap">
                <Link to="/" className="hover:text-indigo-600">Home</Link>
                <ChevronRight size={16} className="mx-1" />
                <span className="font-semibold">{product.category || 'Category'}</span>
                <ChevronRight size={16} className="mx-1" />
                <span className="text-gray-800 truncate">{product.name}</span>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex justify-center items-start">
                    <div className="w-full h-auto overflow-hidden rounded-lg border">
                        <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-contain transition-transform duration-300 ease-in-out hover:scale-110"
                        />
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
                    <p className="text-gray-500 mb-4">{product.category}</p>
                    
                    <div className="text-4xl font-extrabold text-gray-900 mb-4">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
                    </div>

                    <p className={`font-semibold mb-4 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                        {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                    </p>

                    <p className="text-gray-600 mb-6">{product.description}</p>

                    <div className="flex items-center space-x-4 mb-6">
                        <label htmlFor="quantity" className="font-semibold">Quantity:</label>
                        <input 
                        type="number" 
                        id="quantity" 
                        name="quantity" 
                        min="1" 
                        max={product.stock > 0 ? product.stock : 1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                        className="w-20 border-gray-300 border rounded-md p-2 text-center"
                        disabled={isOutOfStock}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button 
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-5 h-5 mr-3" />
                            Add to Cart
                        </button>
                        <button 
                            onClick={handleBuyNow}
                            disabled={isOutOfStock}
                            className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Zap className="w-5 h-5 mr-3" />
                            Buy Now
                        </button>
                    </div>

                    <div className="border-t border-b py-4 space-y-3 text-sm">
                       <div className="flex items-center text-gray-600"><Truck size={18} className="mr-3 text-indigo-500"/> Free & Fast Delivery</div>
                       <div className="flex items-center text-gray-600"><RotateCw size={18} className="mr-3 text-indigo-500"/> 7 Day Return Policy</div>
                       <div className="flex items-center text-gray-600"><Award size={18} className="mr-3 text-indigo-500"/> 1 Year Warranty</div>
                    </div>

                </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Product Details</h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-gray-700">
                        {Object.entries(product).map(([key, value]) => {
                            if (['name', 'description', 'category', 'price', 'stock'].includes(key) && value) {
                                return (
                                    <React.Fragment key={key}>
                                        <dt className="font-semibold capitalize">{key}</dt>
                                        <dd>{key === 'price' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value as number) : String(value)}</dd>
                                    </React.Fragment>
                                );
                            }
                            return null;
                        })}
                    </dl>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
                    <h3 className="font-bold text-lg mb-2">Sold By</h3>
                    <p className="text-indigo-600 font-semibold">DAR CYCLE HUB</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Shield size={16} className="text-green-500 mr-2" />
                        <span>Secure payments and transactions</span>
                    </div>
                </div>
            </div>

            {similarProducts.length > 0 && (
                <div className="mt-12">
                     <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {similarProducts.map(p => <ProductCard key={p.id} product={p}/>)}
                     </div>
                </div>
            )}
        </div>
    </div>
  );
};

const ProductDetailSkeleton: React.FC = () => (
    <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-200 h-6 w-1/3 mb-4 rounded animate-pulse"></div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                <div className="bg-gray-200 w-full h-96 rounded-lg"></div>
                <div className="space-y-6">
                    <div className="bg-gray-200 h-8 w-3/4 rounded"></div>
                    <div className="bg-gray-200 h-6 w-1/4 rounded"></div>
                    <div className="bg-gray-200 h-12 w-1/2 rounded"></div>
                    <div className="bg-gray-200 h-20 w-full rounded"></div>
                    <div className="flex gap-4">
                        <div className="bg-gray-200 h-14 w-full rounded-lg"></div>
                        <div className="bg-gray-200 h-14 w-full rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default ProductDetailPage;