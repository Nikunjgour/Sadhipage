// Ye component user ko uske generated wedding page ka live preview dikhata hai with Desktop/Mobile toggle, share link, edit, regenerate, aur delete actions
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// NEW: TanStack Query hooks use kiye preview data fetch aur cache ke liye
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getMyWedding, deleteWedding, submitRsvp } from '../../api/api';
import { useToast } from '../../context/ToastContext';
import { injectRsvpHarness, useRsvpRelay } from '../../utils/rsvpHtml';

export default function MyWeddingPagePreview() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const iframeRef = useRef(null);

  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' (100%) | 'mobile' (375px)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // CHANGED: TanStack useQuery se user wedding data fetch kiya
  const {
    data: wedding,
    isLoading: loading,
  } = useQuery({
    // staleTime 0 + refetchOnMount 'always': preview khulte hi sabse naya
    // generatedHTML aata hai (purane cached page turant nahi dikhega)
    queryKey: ['myWedding'],
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const res = await getMyWedding();
      return res.wedding || res.data?.wedding || res;
    },
  });

  // Public link copy handler (sirf real shareSlug — Mongo _id backend 404 dega)
  const shareSlug = wedding?.shareSlug || wedding?.slug || '';
  const publicShareUrl = shareSlug ? `${window.location.origin}/w/${shareSlug}` : '';

  // RSVP relay: sirf real shareSlug use karein (Mongo _id backend 404 dega)
  const rsvpSlug = wedding?.shareSlug || wedding?.slug || null;
  useRsvpRelay(iframeRef, rsvpSlug, submitRsvp);

  const handleCopy = () => {
    if (!publicShareUrl) return;
    navigator.clipboard.writeText(publicShareUrl);
    setCopied(true);
    addToast('Wedding URL clipboard me copy ho gaya! 🔗', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  // Delete wedding handler
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteWedding();
      addToast('Aapka wedding project safaltapoorvak delete ho gaya.', 'success');
      // Query cache invalidate kiya — UI turant NOT_CREATED state par reset ho jaye
      queryClient.invalidateQueries({ queryKey: ['myWedding'] });
      queryClient.invalidateQueries({ queryKey: ['myWeddingRsvps'] });
      setDeleteModalOpen(false);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Delete karne me asafal rahe', 'error');
    } finally {
      setDeleting(false);
    }
  };


  const rawHtml = wedding?.generatedHTML || wedding?.html;
  const htmlContent = rawHtml ? injectRsvpHarness(rawHtml) : '';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      <Sidebar variant="user" />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Control Bar */}
        <header className="bg-white border-b border-[#EADCC9] px-4 sm:px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 z-20">
          
          {/* Title & Couple Name */}
          <div className="flex items-center gap-3">
            <span className="text-xl">💍</span>
            <div>
              <h1 className="font-serif font-bold text-base sm:text-lg text-[#7A1E3A] truncate max-w-[200px] sm:max-w-xs">
                {wedding ? `${wedding.brideName} & ${wedding.groomName}` : 'Wedding Preview'}
              </h1>
              <p className="text-[11px] text-[#7A7A7A]">Live AI Page Preview</p>
            </div>
          </div>

          {/* Device Toggle (Desktop vs Mobile) */}
          <div className="flex items-center bg-[#FFF9F2] p-1 rounded-xl border border-[#EADCC9]">
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-[#7A1E3A] text-white shadow-xs'
                  : 'text-[#7A7A7A] hover:text-[#7A1E3A]'
              }`}
            >
              <span>💻</span>
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-[#7A1E3A] text-white shadow-xs'
                  : 'text-[#7A7A7A] hover:text-[#7A1E3A]'
              }`}
            >
              <span>📱</span>
              <span className="hidden sm:inline">Mobile (375px)</span>
            </button>
          </div>

          {/* Action Buttons: Share, Regenerate, Edit Details, Delete */}
          <div className="flex items-center gap-2">
            {publicShareUrl ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                icon={copied ? '✓' : '🔗'}
              >
                {copied ? 'Copied' : 'Share'}
              </Button>
            ) : (
              <span className="text-xs text-[#7A7A7A] italic">Generate your page first.</span>
            )}

            <Link to="/wedding/generate">
              <Button variant="secondary" size="sm" icon="🔄">
                Regenerate
              </Button>
            </Link>

            <Link to="/wedding/details">
              <Button variant="secondary" size="sm" icon="✎">
                Edit Details
              </Button>
            </Link>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              icon="🗑️"
            >
              Delete
            </Button>
          </div>

        </header>

        {/* Preview Frame Container */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-2 sm:p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner message="Wedding preview load ho raha hai..." />
          ) : !htmlContent ? (
            <div className="card-royal p-8 text-center max-w-md bg-white">
              <span className="text-4xl block mb-2">✨</span>
              <h3 className="font-serif text-xl font-bold text-[#7A1E3A] mb-2">
                No Generated Page Found
              </h3>
              <p className="text-xs text-[#7A7A7A] mb-6">
                Aapne abhi tak wedding webpage generate nahi kiya hai. AI Generator par click karein.
              </p>
              <Link to="/wedding/generate">
                <Button variant="primary">
                  Generate with AI Now ➔
                </Button>
              </Link>
            </div>
          ) : (
            /* Device Frame */
            <div
              className={`transition-all duration-300 h-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-300 flex flex-col ${
                viewMode === 'mobile'
                  ? 'w-[375px] max-w-full my-auto border-8 border-gray-800 rounded-[36px] shadow-2xl h-[700px]'
                  : 'w-full h-full'
              }`}
            >
              {/* Mobile device top notch simulation */}
              {viewMode === 'mobile' && (
                <div className="bg-gray-800 py-1.5 flex justify-center items-center shrink-0">
                  <div className="w-16 h-3 bg-black rounded-full" />
                </div>
              )}

              {/* Iframe for generated wedding page */}
              <iframe
                ref={iframeRef}
                title="Wedding Page Live Preview"
                srcDoc={htmlContent}
                className="w-full flex-1 border-none bg-white"
                sandbox="allow-scripts allow-forms allow-popups"
              />
            </div>
          )}
        </div>

      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete Wedding Page"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#2B2B2B]">
            Kya aap sach me apna wedding project delete karna chahte hain? Isse aapka saara data aur live link permanently remove ho jayega.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EADCC9]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              loading={deleting}
            >
              Haan, Delete Karein
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
