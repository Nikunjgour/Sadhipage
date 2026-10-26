// Ye component Admin ke liye saare wedding projects ki list, search filter, edit form (with HTML editor), aur delete operations handle karta hai
import React, { useState, useMemo } from 'react';
// NEW: TanStack Query hooks import kiye
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminGetWeddings, adminUpdateWedding, adminDeleteWedding } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function AdminWeddingsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editWedding, setEditWedding] = useState(null);
  const [editFormData, setEditFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: '',
    venue: '',
    story: '',
    generatedHTML: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CHANGED: TanStack useQuery se weddings fetch aur caching handle kiya
  const {
    data: weddings = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['adminWeddings'],
    queryFn: async () => {
      const data = await adminGetWeddings();
      return data.weddings || data.data?.weddings || data || [];
    },
  });

  // Search filter (couple names, venue, owner/user)
  const filteredWeddings = useMemo(() => {
    if (!searchTerm.trim()) return weddings;
    const term = searchTerm.toLowerCase();
    return weddings.filter(
      (w) =>
        w.brideName?.toLowerCase().includes(term) ||
        w.groomName?.toLowerCase().includes(term) ||
        w.venue?.toLowerCase().includes(term) ||
        (w.owner?.email || w.user?.email)?.toLowerCase().includes(term) ||
        (w.owner?.name || w.user?.name)?.toLowerCase().includes(term)
    );
  }, [weddings, searchTerm]);

  // Edit modal open karna
  const handleOpenEdit = (wedding) => {
    setEditWedding(wedding);
    let dateStr = '';
    if (wedding.weddingDate) {
      dateStr = new Date(wedding.weddingDate).toISOString().split('T')[0];
    }
    setEditFormData({
      brideName: wedding.brideName || '',
      groomName: wedding.groomName || '',
      weddingDate: dateStr,
      venue: wedding.venue || '',
      story: wedding.story || '',
      generatedHTML: wedding.generatedHTML || wedding.html || '',
    });
  };

  // Update submission (PUT /admin/weddings/:id)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editWedding) return;

    try {
      setIsUpdating(true);
      const id = editWedding._id || editWedding.id;
      await adminUpdateWedding(id, editFormData);
      addToast('Wedding details successfully update ho gayi!', 'success');
      setEditWedding(null);
      // Live query invalidation
      queryClient.invalidateQueries({ queryKey: ['adminWeddings'] });
    } catch (err) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete submission (DELETE /admin/weddings/:id)
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const id = deleteTarget._id || deleteTarget.id;
      const res = await adminDeleteWedding(id);
      const rsvpsCount = res?.deletedRsvps ?? res?.data?.deletedRsvps ?? 0;
      addToast(
        res?.message || `Wedding project aur ${rsvpsCount} RSVPs delete ho gaye.`,
        'success'
      );
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminWeddings'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      <Sidebar variant="admin" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#C9A24B]">
              Admin Console
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
              Wedding Pages Directory 💒
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Inspect all created wedding sites, edit layouts or generated HTML code.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-[#FFF9F2] text-[#7A1E3A] border border-[#C9A24B] px-3 py-1.5 rounded-full font-bold">
              Total: {weddings.length} Weddings
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 card-royal p-4 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              id="searchWeddings"
              placeholder="Search by couple names, venue, or owner..."
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

        {/* Weddings Table / Mobile Cards */}
        {loading ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Weddings load ho rahi hain..." />
          </div>
        ) : filteredWeddings.length === 0 ? (
          <div className="card-royal p-12 text-center bg-white">
            <p className="text-base text-[#7A7A7A]">
              Koi wedding record nahi mila.
            </p>
          </div>
        ) : (
          <div className="card-royal bg-white overflow-hidden shadow-sm">
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EADCC9] bg-[#FFF9F2]/70 text-xs font-semibold text-[#7A1E3A] uppercase tracking-wider">
                    <th className="py-4 px-6">Couple Names</th>
                    <th className="py-4 px-6">Owner</th>
                    <th className="py-4 px-6">Wedding Date</th>
                    <th className="py-4 px-6">Venue</th>
                    <th className="py-4 px-6">Created Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADCC9] text-sm text-[#2B2B2B]">
                  {filteredWeddings.map((w) => {
                    const id = w._id || w.id;
                    const slug = w.shareSlug || w.slug || id;
                    return (
                      <tr key={id} className="hover:bg-[#FFF9F2]/40 transition-colors">
                        <td className="py-4 px-6 font-serif font-bold text-[#7A1E3A]">
                          {w.brideName || 'Bride'} & {w.groomName || 'Groom'}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#7A7A7A]">
                          <p className="font-medium text-[#2B2B2B]">{w.owner?.name || 'Owner'}</p>
                          <p>{w.owner?.email || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#2B2B2B]">
                          {w.weddingDate ? new Date(w.weddingDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#7A7A7A] max-w-[180px] truncate">
                          {w.venue || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-xs text-[#7A7A7A]">
                          {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <a
                            href={`/w/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              View ↗
                            </Button>
                          </a>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(w)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(w)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-[#EADCC9]">
              {filteredWeddings.map((w) => {
                const id = w._id || w.id;
                const slug = w.shareSlug || w.slug || id;
                return (
                  <div key={id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-base text-[#7A1E3A]">
                        {w.brideName || 'Bride'} & {w.groomName || 'Groom'}
                      </h3>
                      <span className="text-[10px] text-[#7A7A7A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EADCC9]">
                        {w.weddingDate ? new Date(w.weddingDate).toLocaleDateString('en-IN') : 'No Date'}
                      </span>
                    </div>

                    <p className="text-xs text-[#7A7A7A] truncate">
                      📍 {w.venue || 'No venue specified'}
                    </p>
                    <p className="text-xs text-[#7A7A7A]">
                      👤 Owner: {w.owner?.name || w.user?.name || w.owner?.email || w.user?.email || 'N/A'}
                    </p>


                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EADCC9]/50">
                      <a
                        href={`/w/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          View ↗
                        </Button>
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(w)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(w)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* Edit Wedding Modal with generatedHTML editor */}
      <Modal
        isOpen={!!editWedding}
        onClose={() => setEditWedding(null)}
        title="Edit Wedding Information & HTML"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="editBride"
              label="Bride's Name"
              value={editFormData.brideName}
              onChange={(e) => setEditFormData({ ...editFormData, brideName: e.target.value })}
              required
            />
            <Input
              id="editGroom"
              label="Groom's Name"
              value={editFormData.groomName}
              onChange={(e) => setEditFormData({ ...editFormData, groomName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="editDate"
              label="Wedding Date"
              type="date"
              value={editFormData.weddingDate}
              onChange={(e) => setEditFormData({ ...editFormData, weddingDate: e.target.value })}
              required
            />
            <Input
              id="editVenue"
              label="Venue Location"
              value={editFormData.venue}
              onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
              required
            />
          </div>

          <Input
            id="editStory"
            label="Love Story"
            type="textarea"
            rows={3}
            value={editFormData.story}
            onChange={(e) => setEditFormData({ ...editFormData, story: e.target.value })}
          />

          {/* Monospace generatedHTML Code Editor */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="editHtml" className="text-sm font-medium text-[#2B2B2B] flex items-center justify-between">
              <span>Generated HTML Code</span>
              <span className="text-xs text-[#7A7A7A] font-mono">HTML / Tailwind CSS</span>
            </label>
            <textarea
              id="editHtml"
              rows={8}
              value={editFormData.generatedHTML}
              onChange={(e) => setEditFormData({ ...editFormData, generatedHTML: e.target.value })}
              placeholder="<html>...</html>"
              className="w-full p-3 font-mono text-xs bg-gray-900 text-green-400 rounded-xl border border-gray-700 outline-none focus:border-[#C9A24B] resize-y"
            />
          </div>

          <div className="pt-4 border-t border-[#EADCC9] flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditWedding(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isUpdating}
            >
              Save Wedding Updates
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Wedding Page Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#2B2B2B]">
            Kya aap sach me <strong>{deleteTarget?.brideName} & {deleteTarget?.groomName}</strong> ka wedding page delete karna chahte hain? Is wedding page ko delete karne par iske saare RSVPs bhi hamesha ke liye delete ho jayenge.
          </p>
          <div className="pt-4 border-t border-[#EADCC9] flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Delete Wedding Page
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
