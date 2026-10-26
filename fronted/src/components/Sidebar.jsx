// Ye component User aur Admin dashboards ke liye responsive sidebar navigation provide karta hai
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ variant = 'user' }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = variant === 'admin';

  // Logged-in user ka actual role (user-view sidebar me admin ko wapas jamiento dene ke liye)
  const userIsAdmin = user?.role === 'admin';

  // Navigation Links configuration
  const userLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Wedding Details', path: '/wedding/details', icon: '📝' },
    { name: 'AI Generator', path: '/wedding/generate', icon: '✨' },
    { name: 'My Wedding Page', path: '/wedding/preview', icon: '💍' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  const adminLinks = [
    { name: 'Analytics Dashboard', path: '/admin/dashboard', icon: '📈' },
    { name: 'Manage Users', path: '/admin/users', icon: '👥' },
    { name: 'Wedding Pages', path: '/admin/weddings', icon: '💒' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar background color: User ke liye crisp ivory/white, Admin ke liye Darker Royal Maroon
  const containerClasses = isAdmin
    ? 'bg-[#380213] text-white border-r border-[#5A1429]'
    : 'bg-white text-[#2B2B2B] border-r border-[#EADCC9]';

  return (
    <>
      {/* Mobile Header Bar with Hamburger Button */}
      <div className={`lg:hidden flex items-center justify-between p-4 border-b ${isAdmin ? 'bg-[#380213] text-white border-[#5A1429]' : 'bg-white text-[#2B2B2B] border-[#EADCC9]'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">💍</span>
          <span className="font-serif font-bold text-lg">
            {isAdmin ? 'Admin Console' : 'ShaadiPage'}
          </span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg hover:bg-black/10 focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          {isMobileOpen ? (
            <span className="text-2xl font-bold">✕</span>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${containerClasses} ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & User info */}
        <div>
          <div className="p-6 border-b border-inherit">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${isAdmin ? 'bg-[#C9A24B] text-[#380213]' : 'bg-[#7A1E3A] text-white'}`}>
                {isAdmin ? '👑' : '💍'}
              </div>
              <div>
                <h1 className={`font-serif text-lg font-bold ${isAdmin ? 'text-[#C9A24B]' : 'text-[#7A1E3A]'}`}>
                  {isAdmin ? 'Admin Portal' : 'ShaadiPage'}
                </h1>
                <p className={`text-xs ${isAdmin ? 'text-gray-300' : 'text-[#7A7A7A]'}`}>
                  {isAdmin ? 'Control Center' : 'Wedding Suite'}
                </p>
              </div>
            </div>

            {/* Current user pill */}
            <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-xs gap-2">
              <span className="truncate max-w-[110px] font-medium opacity-90">
                {user?.name || 'Logged In'}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Admin-only quick navigation to the Admin Panel */}
                {!isAdmin && userIsAdmin && (
                  <button
                    onClick={() => {
                      navigate('/admin/dashboard');
                      setIsMobileOpen(false);
                    }}
                    className="px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] bg-[#C9A24B] text-white hover:bg-[#B8913D] transition-colors"
                    title="Go to Admin Panel"
                  >
                    👑 Admin
                  </button>
                )}
                {!userIsAdmin && (
                  <span className={`px-2 py-0.5 rounded-full font-semibold uppercase text-[10px] ${isAdmin ? 'bg-[#C9A24B] text-[#380213]' : 'bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B]'}`}>
                    {user?.role || (isAdmin ? 'admin' : 'user')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? isAdmin
                        ? 'bg-[#C9A24B] text-[#380213] font-bold shadow-md'
                        : 'bg-[#7A1E3A] text-white font-semibold shadow-md'
                      : isAdmin
                      ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                      : 'text-[#2B2B2B] hover:bg-[#FFF9F2] hover:text-[#7A1E3A]'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Logout & Switch mode */}
        <div className="p-4 border-t border-inherit">
          {/* Admin user viewing the user side can jump back to the Admin Panel */}
          {!isAdmin && userIsAdmin && (
            <button
              onClick={() => {
                navigate('/admin/dashboard');
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 mb-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#C9A24B]/10 hover:bg-[#C9A24B]/20 text-[#8A6A1F] border border-[#C9A24B]/50 transition-colors"
            >
              <span>Switch to Admin Panel ➔</span>
            </button>
          )}

          {/* Admin user can jump to public/user side */}
          {isAdmin && (
            <button
              onClick={() => {
                navigate('/dashboard');
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 mb-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-[#C9A24B] transition-colors"
            >
              <span>Switch to User View ➔</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isAdmin
                ? 'bg-red-900/60 hover:bg-red-800 text-red-200'
                : 'bg-red-50 hover:bg-red-100 text-[#C62828] border border-red-200'
            }`}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
