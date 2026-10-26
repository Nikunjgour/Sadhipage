// Ye component logged-in user ka profile details, role badge, aur logout action render karta hai
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getProfile } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  // Sidebar ki tarah useAuth se direct logged-in user praapt kiya
  const { user, logout, updateUserData } = useAuth();
  const { addToast } = useToast();

  // TanStack useQuery hook se user profile load aur caching handle kiya.
  // Query key user-id se scoped hai taaki logout ke baad dusre account ka
  // cached profile dikhe nahi, aur initialData hataya taaki fresh fetch ho.
  const {
    data: profileData,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userProfile', user?._id],
    queryFn: async () => {
      const data = await getProfile();
      const p = data?.user || data?.data?.user || data;
      if (p && (p.name || p.email)) {
        updateUserData(p);
      }
      return p;
    },
  });

  // Effective user: priority to fetched profileData, fallback to current session user
  const effectiveUser = profileData || user;

  // Logout handler
  const handleLogout = () => {
    logout();
    addToast('You have been logged out.', 'info');
    navigate('/login');
  };

  // Formatted display values (real fallbacks, koi hardcoded naam nahi)
  const displayName = effectiveUser?.name || 'Not provided';
  const displayEmail = effectiveUser?.email || '';
  const displayRole = effectiveUser?.role === 'admin' ? 'Administrator' : 'User';
  const avatarInitial = ((effectiveUser?.name || '').trim().charAt(0) || 'U').toUpperCase();

  // Format "Member Since" (e.g. "October 2026" or "October 17, 2026")
  const formatMemberSince = (dateStr) => {
    if (!dateStr) return 'Not provided';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Not provided';
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Not provided';
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      <Sidebar variant="user" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
            My Account & Profile 👤
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Manage your personal credentials and account role
          </p>
        </div>

        {/* Loading State when no user data is cached yet */}
        {loading && !effectiveUser ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Loading profile details..." />
          </div>
        ) : isError && !effectiveUser ? (
          /* Error State */
          <div className="card-royal p-10 bg-white text-center space-y-4">
            <span className="text-4xl block">⚠️</span>
            <h2 className="font-serif text-2xl font-bold text-[#7A1E3A]">
              Could Not Load Profile
            </h2>
            <p className="text-sm text-[#7A7A7A] max-w-md mx-auto">
              {error?.message || 'Could not connect to the server. Please try again.'}
            </p>
            <Button variant="primary" size="md" onClick={() => refetch()}>
              Retry Loading 🔄
            </Button>
          </div>
        ) : (
          <div className="card-royal p-6 sm:p-10 bg-white space-y-8">
            {/* Profile Avatar & Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#EADCC9]">
              <div className="w-20 h-20 rounded-full bg-[#FFF9F2] border-2 border-[#C9A24B] flex items-center justify-center text-3xl shadow-sm text-[#7A1E3A] font-serif font-bold select-none">
                {avatarInitial}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="font-serif text-2xl font-bold text-[#7A1E3A]">
                    {displayName}
                  </h2>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    effectiveUser?.role === 'admin'
                      ? 'bg-[#380213] text-[#C9A24B] border border-[#C9A24B]'
                      : 'bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B]'
                  }`}>
                    {displayRole}
                  </span>
                </div>
                <p className="text-sm text-[#7A7A7A]">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Profile Details List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#FFF9F2]/60 border border-[#EADCC9]">
                <label className="text-xs uppercase font-bold text-[#7A7A7A] block mb-1">
                  Full Name
                </label>
                <p className="font-medium text-sm text-[#2B2B2B]">
                  {displayName}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF9F2]/60 border border-[#EADCC9]">
                <label className="text-xs uppercase font-bold text-[#7A7A7A] block mb-1">
                  Email Address
                </label>
                <p className="font-medium text-sm text-[#2B2B2B]">
                  {displayEmail || 'Not provided'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF9F2]/60 border border-[#EADCC9]">
                <label className="text-xs uppercase font-bold text-[#7A7A7A] block mb-1">
                  Account Role
                </label>
                <p className="font-medium text-sm text-[#2B2B2B] capitalize">
                  {displayRole}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFF9F2]/60 border border-[#EADCC9]">
                <label className="text-xs uppercase font-bold text-[#7A7A7A] block mb-1">
                  Member Since
                </label>
                <p className="font-medium text-sm text-[#2B2B2B]">
                  {formatMemberSince(effectiveUser?.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-[#EADCC9] flex items-center justify-between">
              <span className="text-xs text-[#7A7A7A]">
                ShaadiPage Platform v1.0
              </span>
              <Button
                variant="danger"
                size="md"
                onClick={handleLogout}
                icon="🚪"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
