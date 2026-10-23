// Ye component logged-in status verify karta hai, agar user logged-in nahi hai to login page pe redirect karta hai
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Agar user session load ho raha hai to spinner dikhao
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  // Agar user logged in nahi hai to login page par bhej do
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
