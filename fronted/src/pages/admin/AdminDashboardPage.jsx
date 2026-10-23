// Ye component Admin portal ka main analytics dashboard render karta hai with stats cards (Users, Weddings, Weekly/Monthly metrics)
import React from 'react';
import { Link } from 'react-router-dom';
// NEW: TanStack Query useQuery hook import kiya
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import { adminGetAnalytics } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboardPage() {
  const { addToast } = useToast();

  // CHANGED: TanStack useQuery hook se live analytics fetch aur caching handle kiya
  const {
    data: analytics,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const res = await adminGetAnalytics();
      return res.analytics || res.data?.analytics || res;
    },
  });


  // Stats cards configuration
  const statCards = [
    {
      title: 'Total Registered Users',
      value: analytics?.totalUsers ?? '—',
      icon: '👥',
      color: 'border-l-[#7A1E3A]',
      link: '/admin/users',
      linkText: 'Manage Users ➔',
    },
    {
      title: 'Total Wedding Pages',
      value: analytics?.totalWeddings ?? '—',
      icon: '💍',
      color: 'border-l-[#C9A24B]',
      link: '/admin/weddings',
      linkText: 'View All Weddings ➔',
    },
    {
      title: 'Pages This Week',
      value: analytics?.pagesThisWeek ?? '—',
      icon: '📅',
      color: 'border-l-[#2E7D32]',
      subtitle: 'Recent activity surge',
    },
    {
      title: 'Pages This Month',
      value: analytics?.pagesThisMonth ?? '—',
      icon: '📈',
      color: 'border-l-[#1E7A4D]',
      subtitle: 'Monthly volume',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      {/* Admin Darker Maroon Sidebar */}
      <Sidebar variant="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#C9A24B]">
                Admin Console
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
              Platform Analytics Overview 📈
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Real-time insights on registered users, active wedding pages, and AI generations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin/users">
              <Button variant="secondary" size="sm">
                Users Directory
              </Button>
            </Link>
            <Link to="/admin/weddings">
              <Button variant="primary" size="sm">
                Weddings Directory
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Analytics metrics calculate ho rahe hain..." />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Stats Cards 4-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, idx) => (
                <div
                  key={idx}
                  className={`card-royal p-6 bg-white border-l-4 ${stat.color} shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-bold text-[#7A7A7A]">
                      {stat.title}
                    </span>
                    <span className="text-2xl p-2 rounded-xl bg-[#FFF9F2] border border-[#EADCC9]">
                      {stat.icon}
                    </span>
                  </div>

                  <div className="font-serif text-3xl font-bold text-[#2B2B2B]">
                    {stat.value}
                  </div>

                  {stat.link ? (
                    <div className="mt-4 pt-3 border-t border-[#EADCC9]">
                      <Link
                        to={stat.link}
                        className="text-xs font-bold text-[#7A1E3A] hover:underline"
                      >
                        {stat.linkText}
                      </Link>
                    </div>
                  ) : stat.subtitle ? (
                    <p className="text-xs text-[#7A7A7A] mt-2">
                      {stat.subtitle}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Quick Management Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Users Quick Card */}
              <div className="card-royal p-6 sm:p-8 bg-white border border-[#EADCC9]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#7A1E3A]">
                      User Management
                    </h2>
                    <p className="text-xs text-[#7A7A7A]">
                      Review all registered accounts, change roles, or remove accounts.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link to="/admin/users">
                    <Button variant="secondary" size="md" className="w-full">
                      Open Users Panel ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Weddings Quick Card */}
              <div className="card-royal p-6 sm:p-8 bg-white border border-[#EADCC9]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">💒</span>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#7A1E3A]">
                      Weddings Management
                    </h2>
                    <p className="text-xs text-[#7A7A7A]">
                      Inspect active projects, customize generated HTML, or view live links.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link to="/admin/weddings">
                    <Button variant="primary" size="md" className="w-full">
                      Open Weddings Panel ➔
                    </Button>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
