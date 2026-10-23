// Ye AuthContext application me logged-in user ki state, JWT token, aur user role ko manage karta hai
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getProfile } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // React Query cache ka client: logout par clear karte hain taaki cached
  // profile/data dusre account me leak na ho
  const queryClient = useQueryClient();
  // User data state me store hota hai (localStorage initial fallback ke sath)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shaadi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // JWT token localStorage se read hota hai
  const [token, setToken] = useState(() => localStorage.getItem('shaadi_token') || null);
  // Initial authentication check ka loading state
  const [loading, setLoading] = useState(true);

  // App mount hone par check karte hain ki token valid hai aur user profile load karte hain
  useEffect(() => {
    async function loadUserProfile() {
      const storedToken = localStorage.getItem('shaadi_token');
      if (storedToken) {
        try {
          const profileData = await getProfile();
          // API profile format handle karte hain
          const realUser = profileData?.user || profileData?.data?.user || profileData;
          if (realUser && realUser.email) {
            setUser(realUser);
            localStorage.setItem('shaadi_user', JSON.stringify(realUser));
          }
        } catch (error) {
          console.error('Failed to verify token, logging out:', error);
          logout();
        }
      }
      setLoading(false);
    }

    loadUserProfile();
  }, [token]);

  // Login action: token aur user data save karta hai
  const login = (authToken, userData) => {
    localStorage.setItem('shaadi_token', authToken);
    if (userData) {
      localStorage.setItem('shaadi_user', JSON.stringify(userData));
    }
    setToken(authToken);
    setUser(userData);
  };

  // Logout action: localStorage aur state ko reset karta hai, React Query
  // cache clear karta hai (profile/wedding data dusre account me nahi dikhega)
  const logout = () => {
    localStorage.removeItem('shaadi_token');
    localStorage.removeItem('shaadi_user');
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  // User details update karne ka helper function
  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('shaadi_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'user',
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook: components me auth state access karne ke liye
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth ko AuthProvider ke andar use kiya jana chahiye');
  }
  return context;
};
