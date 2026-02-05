
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import HomePage from './pages/user/HomePage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import CartPage from './pages/user/CartPage';
import OrdersPage from './pages/user/OrdersPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="product/:id" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            </Route>
            
            <Route path="/admin" element={<AdminProtectedRoute><Layout isAdmin={true} /></AdminProtectedRoute>}>
               <Route path="dashboard" element={<AdminDashboardPage />} />
               <Route path="products" element={<AdminProductsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
