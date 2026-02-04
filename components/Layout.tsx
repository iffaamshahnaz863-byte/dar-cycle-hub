
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

interface LayoutProps {
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ isAdmin = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header isAdmin={isAdmin} />
      <main className="container mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
