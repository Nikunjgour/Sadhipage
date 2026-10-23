// Ye component check karta hai ki user logged in hai AUR uska role 'admin' hai
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Agar user session load ho raha hai to spinner dikhao
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <LoadingSpinner message="Checking admin authorization..." />
      </div>
    );
  }

  // Agar logged in nahi hai to login pe redirect
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Agar logged in hai lekin admin role nahi hai to user dashboard pe bhej do
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
