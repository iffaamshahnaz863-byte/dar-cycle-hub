
import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { getProducts, deleteProduct } from '../../services/mockApi';
import ProductForm from '../../components/admin/ProductForm';
import { Edit, Trash, PlusCircle, AlertCircle } from 'lucide-react';

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      } catch (err: any) {
        console.error("Failed to delete product:", err);
        setError("Failed to delete product. It may be associated with existing orders.");
      }
    }
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    fetchProducts(); // Refresh list after add/edit
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">Loading products...</div>;
    }

    if (error) {
       return (
        <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12" />
          <h3 className="mt-2 text-sm font-medium">An Error Occurred</h3>
          <div className="mt-1 text-sm">
            <p>{error}</p>
          </div>
        </div>
      );
    }
    
    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl} alt={product.name}/>
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Product
        </button>
      </div>
      
      {renderContent()}

      {isFormOpen && <ProductForm product={editingProduct} onClose={handleFormClose} />}
    </div>
  );
};

export default AdminProductsPage;
