import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../component/Sidebar';
import { Header } from '../component/Header';
import { Footer } from '../component/Footer';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;