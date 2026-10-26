// Ye component Admin ke liye registered users ki table/cards list, search filter, edit modal aur delete action render karta hai
import React, { useState, useMemo } from 'react';
// NEW: TanStack Query hooks import kiye
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminGetUsers, adminUpdateUser, adminDeleteUser } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editUser, setEditUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Delete Modal State
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CHANGED: TanStack useQuery hook se live users list fetch aur caching
  const {
    data: users = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const data = await adminGetUsers();
      return data.users || data.data?.users || data || [];
    },
  });

  // Client-side search filter
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Edit Modal open karna (sirf normal users ke liye)
  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
    });
  };

  // User details update submit karna (PUT /admin/users/:id)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      setIsEditing(true);
      const userId = editUser._id || editUser.id;
      const res = await adminUpdateUser(userId, {
        name: editFormData.name,
        email: editFormData.email,
      });
      addToast(res?.message || 'User updated successfully!', 'success');
      setEditUser(null);
      // Query cache invalidate karke live data sync karo
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    } catch (err) {
      addToast(err.message || 'User could not be updated', 'error');
    } finally {
      setIsEditing(false);
    }
  };

  // User delete confirm karna (DELETE /admin/users/:id)
  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;

    try {
      setIsDeleting(true);
      const userId = deleteUserTarget._id || deleteUserTarget.id;
      const res = await adminDeleteUser(userId);
      const weddingsCount = res?.deletedWeddings ?? res?.data?.deletedWeddings ?? 0;
      const rsvpsCount = res?.deletedRsvps ?? res?.data?.deletedRsvps ?? 0;
      addToast(
        res?.message || `User deleted (${weddingsCount} wedding, ${rsvpsCount} RSVPs removed successfully).`,
        'success'
      );
      setDeleteUserTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminWeddings'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    } catch (err) {
      addToast(err.message || 'User could not be deleted', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      <Sidebar variant="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#C9A24B]">
              Admin Console
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
              Manage Users 👥
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              View, edit credentials, or remove registered accounts across the platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B] px-3 py-1.5 rounded-full font-bold">
              Total Users: {users.filter((u) => u.role !== 'admin').length}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 card-royal p-4 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              id="searchUsers"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-[#7A1E3A] hover:underline font-semibold"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Users Table / Mobile Cards */}
        {loading ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Loading users..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card-royal p-12 text-center bg-white">
            <p className="text-base text-[#7A7A7A]">
              No users matched your search.
            </p>
          </div>
        ) : (
          <div className="card-royal bg-white overflow-hidden shadow-sm">
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EADCC9] bg-[#FFF9F2]/70 text-xs font-semibold text-[#7A1E3A] uppercase tracking-wider">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADCC9] text-sm text-[#2B2B2B]">
                  {filteredUsers.map((u) => {
                    const userId = u._id || u.id;
                    const isAdminUser = u.role === 'admin';

                    return (
                      <tr key={userId} className="hover:bg-[#FFF9F2]/40 transition-colors">
                        <td className="py-4 px-6 font-medium text-[#7A1E3A] flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#FFF9F2] border border-[#C9A24B] flex items-center justify-center text-xs font-bold text-[#7A1E3A]">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                          <span>{u.name || 'Unnamed'}</span>
                        </td>
                        <td className="py-4 px-6 text-[#7A7A7A]">
                          {u.email}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isAdminUser
                              ? 'bg-[#380213] text-[#C9A24B] border border-[#C9A24B]'
                              : 'bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B]/50'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#7A7A7A]">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('en-IN')
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {isAdminUser ? (
                            <span className="text-xs text-[#7A7A7A] italic">—</span>
                          ) : (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEdit(u)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteUserTarget(u)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#EADCC9]">
              {filteredUsers.map((u) => {
                const userId = u._id || u.id;
                const isAdminUser = u.role === 'admin';

                return (
                  <div key={userId} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-serif font-bold text-[#7A1E3A]">
                        <span className="w-7 h-7 rounded-full bg-[#FFF9F2] border border-[#C9A24B] flex items-center justify-center text-xs">
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                        <span>{u.name || 'Unnamed'}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isAdminUser
                          ? 'bg-[#380213] text-[#C9A24B] border border-[#C9A24B]'
                          : 'bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B]/50'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </div>

                    <p className="text-xs text-[#7A7A7A] truncate">
                      ✉️ {u.email}
                    </p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#EADCC9]/50 text-xs gap-2">
                      <span className="text-[#7A7A7A]">
                        Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {isAdminUser ? (
                          <span className="text-xs text-[#7A7A7A] italic">—</span>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(u)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteUserTarget(u)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User Details"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input
            id="editName"
            label="Full Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <Input
            id="editEmail"
            label="Email Address"
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            required
          />

          <div className="pt-4 border-t border-[#EADCC9] flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditUser(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isEditing}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        title="Confirm User Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#2B2B2B]">
            Are you sure you want to delete user <strong>{deleteUserTarget?.name}</strong> ({deleteUserTarget?.email})? Deleting this user will also permanently delete their wedding page and all RSVPs.
          </p>
          <div className="pt-4 border-t border-[#EADCC9] flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteUserTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteUser}
              loading={isDeleting}
            >
              Delete User Permanently
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
