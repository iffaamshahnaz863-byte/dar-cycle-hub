
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, User as UserIcon, LogOut, Package, Users, Home, Shield } from 'lucide-react';

interface HeaderProps {
    isAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isAdmin }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  const AdminNav = () => (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link to="/admin/dashboard" className="flex items-center hover:text-indigo-600 transition-colors">
        <Package className="w-4 h-4 mr-1" />
        Orders
      </Link>
      <Link to="/admin/products" className="flex items-center hover:text-indigo-600 transition-colors">
        <Users className="w-4 h-4 mr-1" />
        Products
      </Link>
    </nav>
  );

  const UserNav = () => (
     <nav className="flex items-center space-x-6 text-sm font-medium">
       <Link to="/" className="flex items-center hover:text-indigo-600 transition-colors">
         <Home className="w-4 h-4 mr-1" />
         Home
       </Link>
       {user && (
         <Link to="/orders" className="flex items-center hover:text-indigo-600 transition-colors">
           <Package className="w-4 h-4 mr-1" />
           My Orders
         </Link>
       )}
     </nav>
  );


  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <Link to={isAdmin ? "/admin/dashboard" : "/"} className="text-2xl font-bold text-indigo-600">
          {isAdmin ? 'Admin Panel' : 'DAR CYCLE HUB'}
        </Link>
        
        {isAdmin ? <AdminNav /> : <UserNav />}

        <div className="flex items-center space-x-4">
          {!isAdmin && (
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm hidden sm:inline">{user.email}</span>
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <LogOut className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          ) : (
            <Link to={isAdmin ? "/admin/login" : "/login"} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;