
import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { addProduct, updateProduct, uploadProductImage } from '../../services/mockApi';
import { X } from 'lucide-react';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    stock: 0,
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        category: product.category,
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setImageFile(e.target.files[0]);
        setFormData(prev => ({ ...prev, imageUrl: URL.createObjectURL(e.target.files[0]) }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // --- 6. Data Validation ---
    if (!formData.name.trim()) {
        setError('Product name is required.');
        return;
    }
    if (isNaN(formData.price) || formData.price < 0) {
        setError('Price must be a valid non-negative number.');
        return;
    }
    if (isNaN(formData.stock) || formData.stock < 0 || !Number.isInteger(formData.stock)) {
        setError('Stock must be a valid non-negative integer.');
        return;
    }
    if (!product && !imageFile) {
        setError('An image is required for a new product.');
        return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = product?.imageUrl || formData.imageUrl;

      if (imageFile) {
        console.log('Step 1: Uploading image...');
        finalImageUrl = await uploadProductImage(imageFile);
        console.log('Step 2: Image uploaded successfully. Public URL:', finalImageUrl);
      } else {
        console.log('Step 1 & 2: Skipping image upload, using existing URL:', finalImageUrl);
      }
      
      const productData = { ...formData, imageUrl: finalImageUrl };
      console.log('Step 3: Preparing product data for database:', productData);

      if (product) {
        console.log('Step 4: Updating existing product...');
        const updated = await updateProduct({ id: product.id, ...productData });
        console.log('Step 5: Product updated successfully in DB:', updated);
        setSuccess('Product updated successfully!');
      } else {
        console.log('Step 4: Adding new product...');
        const newProduct = await addProduct(productData);
        console.log('Step 5: Product added successfully in DB:', newProduct);
        setSuccess('Product added successfully!');
      }
      
      setTimeout(() => {
        onClose(); // This also triggers a refresh in the parent component.
      }, 1500);

    } catch (err: any) {
      console.error('Failed to save product. Full error object:', err);
      let userFriendlyError = err.message || 'An unknown error occurred. Please check the console.';
      if (err.message && err.message.includes('violates row-level security policy')) {
        userFriendlyError = "Database permission denied. Please check your Supabase Row Level Security (RLS) policies for the 'products' table.";
      }
      setError(userFriendlyError);
    } finally {
      // --- 1. Ensure loading state ALWAYS stops ---
      console.log('Step 6: Final block reached. Resetting submitting state.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Success! </strong>
                <span className="block sm:inline">{success}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Title</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input type="text" name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" rows={3}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" step="0.01" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <input type="file" name="image" onChange={handleImageChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            {formData.imageUrl && <img src={formData.imageUrl} alt="Product Preview" className="mt-2 h-24 w-24 object-cover rounded"/>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isSubmitting || !!success} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
