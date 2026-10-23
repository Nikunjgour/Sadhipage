// Ye App component poore frontend application ki routing aur context providers setup karta hai
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// NEW: TanStack Query client aur provider import kiya gaya
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// NEW: Global TanStack QueryClient instance setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes cache validity
    },
  },
});

// Protected Route guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import PublicWeddingPage from './pages/public/PublicWeddingPage';
import PrivatePage from './pages/public/PrivatePage';
import NotFoundPage from './pages/public/NotFoundPage';

// User Pages
import DashboardPage from './pages/user/DashboardPage';
import WeddingDetailsFormPage from './pages/user/WeddingDetailsFormPage';
import AIGenerationPage from './pages/user/AIGenerationPage';
import MyWeddingPagePreview from './pages/user/MyWeddingPagePreview';
import ProfilePage from './pages/user/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminWeddingsPage from './pages/admin/AdminWeddingsPage';

export default function App() {
  return (
    // NEW: QueryClientProvider wrap kiya
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Toast provider notifications ke liye aur AuthProvider user session ke liye */}
        <ToastProvider>
          <AuthProvider>
            <Routes>

            {/* ---------------- PUBLIC ROUTES ---------------- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/w/:shareSlug" element={<PublicWeddingPage />} />
            <Route path="/private" element={<PrivatePage />} />

            {/* ---------------- PROTECTED USER ROUTES ---------------- */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wedding/details"
              element={
                <ProtectedRoute>
                  <WeddingDetailsFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wedding/generate"
              element={
                <ProtectedRoute>
                  <AIGenerationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wedding/preview"
              element={
                <ProtectedRoute>
                  <MyWeddingPagePreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* ---------------- PROTECTED ADMIN ROUTES ---------------- */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/weddings"
              element={
                <AdminRoute>
                  <AdminWeddingsPage />
                </AdminRoute>
              }
            />

            {/* ---------------- 404 NOT FOUND ---------------- */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
}

