
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Address } from '../../types';
import { placeOrderWithDetails } from '../../services/mockApi';
import { Lock } from 'lucide-react';

const CheckoutPage: React.FC = () => {
    const { user } = useAuth();
    const { cart, cartTotal, cartCount, clearCart } = useCart();
    const navigate = useNavigate();

    const [address, setAddress] = useState<Address>({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'Home',
    });
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || cart.length === 0) {
            navigate('/');
        }
    }, [user, cart, navigate]);

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setAddress(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!address.fullName.trim() || !address.phone.trim() || !address.addressLine1.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
            setError('Please fill in all required fields.');
            return false;
        }
        if (!/^\d{10}$/.test(address.phone)) {
            setError('Please enter a valid 10-digit mobile number.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const newOrderId = await placeOrderWithDetails(user!.id, user!.email, address, cart);
            clearCart();
            navigate('/order-success', { state: { orderId: newOrderId } });
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const deliveryCharges = 0; // Or calculate based on logic
    const totalAmount = cartTotal + deliveryCharges;

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Side: Details & Address */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Customer Details */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">1. Customer Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                                        <input type="text" name="fullName" id="fullName" value={address.fullName} onChange={handleAddressChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                                        <input type="tel" name="phone" id="phone" value={address.phone} onChange={handleAddressChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                        <input type="email" name="email" id="email" value={user?.email || ''} readOnly className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                            {/* Shipping Address */}
                             <div className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">2. Shipping Address</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">House / Flat / Building Name</label>
                                        <input type="text" name="addressLine1" id="addressLine1" value={address.addressLine1} onChange={handleAddressChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                     <div className="md:col-span-2">
                                        <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">Street / Area</label>
                                        <input type="text" name="addressLine2" id="addressLine2" value={address.addressLine2} onChange={handleAddressChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                        <input type="text" name="city" id="city" value={address.city} onChange={handleAddressChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                     <div>
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                                        <input type="text" name="state" id="state" value={address.state} onChange={handleAddressChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code (PIN)</label>
                                        <input type="text" name="postalCode" id="postalCode" value={address.postalCode} onChange={handleAddressChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                     <div>
                                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                                        <input type="text" name="country" id="country" value={address.country} onChange={handleAddressChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" readOnly />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Address Type</label>
                                        <select name="addressType" value={address.addressType} onChange={handleAddressChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2">
                                            <option>Home</option>
                                            <option>Office</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                             {/* Payment Method */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">3. Payment Method</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center p-3 border rounded-md">
                                        <input type="radio" id="cod" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                        <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700">Cash on Delivery (COD)</label>
                                    </div>
                                     <div className="flex items-center p-3 border rounded-md bg-gray-100 cursor-not-allowed">
                                        <input type="radio" id="upi" name="paymentMethod" value="upi" disabled className="h-4 w-4 text-indigo-600 border-gray-300" />
                                        <label htmlFor="upi" className="ml-3 block text-sm font-medium text-gray-400">UPI (Coming Soon)</label>
                                    </div>
                                    <div className="flex items-center p-3 border rounded-md bg-gray-100 cursor-not-allowed">
                                        <input type="radio" id="card" name="paymentMethod" value="card" disabled className="h-4 w-4 text-indigo-600 border-gray-300" />
                                        <label htmlFor="card" className="ml-3 block text-sm font-medium text-gray-400">Credit/Debit Card (Coming Soon)</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Order Summary */}
                        <div className="lg:col-span-1">
                             <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
                                <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h2>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-md mr-3" />
                                                <div>
                                                    <p className="font-semibold text-sm">{item.product.name}</p>
                                                    <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-sm">${(item.product.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal ({cartCount} items)</span>
                                        <span>${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Delivery Charges</span>
                                        <span className="font-semibold text-green-600">FREE</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                        <span>Total Amount</span>
                                        <span>${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-orange-500 text-white mt-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors font-semibold flex items-center justify-center"
                                >
                                    <Lock size={16} className="mr-2"/>
                                    {isLoading ? 'Placing Order...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;
