// Ye component public aur marketing pages ka main top navigation bar hai
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Logout action handle karna
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#EADCC9] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7A1E3A] to-[#A03B56] flex items-center justify-center text-white font-serif font-bold text-xl shadow-md border border-[#C9A24B]/60">
              💍
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#7A1E3A] group-hover:text-[#5A1429] transition-colors">
                Shaadi<span className="text-[#C9A24B]">Page</span>
              </span>
              <p className="text-[10px] tracking-widest uppercase text-[#7A7A7A] font-medium hidden sm:block">
                Royal Wedding Spaces
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="/#features"
              className="text-sm font-medium text-[#2B2B2B] hover:text-[#7A1E3A] transition-colors"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              className="text-sm font-medium text-[#2B2B2B] hover:text-[#7A1E3A] transition-colors"
            >
              How It Works
            </a>
            
            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                  className="text-sm font-semibold text-[#7A1E3A] hover:underline"
                >
                  {isAdmin ? 'Admin Console' : 'My Dashboard'}
                </Link>
                <span className="text-xs bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B] px-2.5 py-1 rounded-full font-medium">
                  {user?.name || 'User'}
                </span>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#7A1E3A] hover:bg-[#FFF9F2] focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <span className="text-2xl font-bold">✕</span>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#EADCC9] px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <a
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] hover:text-[#7A1E3A]"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#2B2B2B] hover:bg-[#FFF9F2] hover:text-[#7A1E3A]"
          >
            How It Works
          </a>

          <div className="pt-4 border-t border-[#EADCC9] flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#7A1E3A] bg-[#FFF9F2]"
                >
                  {isAdmin ? 'Admin Console' : 'My Dashboard'}
                </Link>
                <Button variant="secondary" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="secondary" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="primary" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
