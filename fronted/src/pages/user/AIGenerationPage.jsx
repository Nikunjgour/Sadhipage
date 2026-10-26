// Ye component entered wedding details ka summary dikhata hai aur AI generation trigger karta hai with loading animation
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// React Query se wedding data + background job ka status polling
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getMyWedding, generateAIPage } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function AIGenerationPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  // Synchronous double-fire guard (di-war state guard se tez, same render tick par bhi safe)
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  // POST /ai/generate ke turant errors (429/500) ka banner text
  const [postError, setPostError] = useState('');

  // Wedding data + generation status. Sirf 'generating' status me har 4s
  // refetch hota hai (status polling), otherwise no interval.
  const {
    data: wedding,
    isLoading: pageLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['myWedding'],
    staleTime: 0,
    refetchOnMount: 'always',
    // Background job polling: status 'generating' hai tabhi interval on
    refetchInterval: (query) =>
      query.state.data?.generationStatus === 'generating' ? 4000 : false,
    queryFn: async () => {
      try {
        const res = await getMyWedding();
        return res.wedding || res.data?.wedding || res;
      } catch (err) {
        // 404/null: user ne details nahi bhari ya page delete kiya — NOT_CREATED state
        if (err.status === 404) return null;
        throw err;
      }
    },
  });

  // UI state Sirf generationStatus se aata hai (legacy docs ke liye fallback)
  const status = wedding?.generationStatus || (wedding?.generatedHTML || wedding?.html ? 'done' : 'idle');
  const hasPage = Boolean(wedding?.generatedHTML || wedding?.html);

  // Status 'generating' -> 'done' flip par ONCE success toast + cache refresh
  const prevStatusRef = useRef(null);
  useEffect(() => {
    if (prevStatusRef.current === 'generating' && status === 'done') {
      addToast('Your Wedding Page has been generated successfully! ✨', 'success');
      queryClient.invalidateQueries({ queryKey: ['myWedding'] });
      queryClient.invalidateQueries({ queryKey: ['myWeddingRsvps'] });
    }
    prevStatusRef.current = status;
  }, [status, addToast, queryClient]);

  // AI Generation trigger: POST /ai/generate (backend turant 202 deta hai,
  // regeneration background job me hoti hai — polling UI ko update karti hai)
  const handleGenerate = async () => {
    // Double-click / StrictMode guard + already-generating guard
    if (submittingRef.current || wedding?.generationStatus === 'generating') return;
    submittingRef.current = true;
    setSubmitting(true);
    setPostError('');
    try {
      await generateAIPage({ weddingId: wedding?._id || wedding?.id });

      // Optimistic flip: spinner turant dikhe (invalidate se fresh data bhi aayega)
      if (wedding) {
        queryClient.setQueryData(['myWedding'], {
          ...wedding,
          generationStatus: 'generating',
          generationError: '',
          generationStartedAt: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['myWedding'] });
    } catch (err) {
      console.error('AI generation error:', err);
      // Requirement: server ka apna message dikhao (429/500), generic text nahi
      const message = err.message || 'Something went wrong while generating. Please try again.';
      setPostError(message);
      addToast(message, 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Banner error: 'failed' status par generationError, POST par postError
  const bannerError =
    status === 'failed'
      ? wedding?.generationError || 'Generation failed.'
      : postError;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      <Sidebar variant="user" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">

        {/* Title bar */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#7A1E3A]">
            AI Wedding Page Generator ✨
          </h1>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Our AI builds your digital wedding page with a refined design system and elegant typography.
          </p>
        </div>

        {pageLoading && !wedding ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Loading wedding information..." />
          </div>
        ) : !wedding?.brideName ? (
          /* NOT_CREATED state: user ne details nahi bhari hain ya page delete ho chuka hai */
          <div className="card-royal p-10 text-center space-y-4">
            <span className="text-4xl">📝</span>
            <h2 className="font-serif text-2xl font-bold text-[#7A1E3A]">
              Wedding Details Missing
            </h2>
            <p className="text-sm text-[#7A7A7A] max-w-md mx-auto">
              Please submit couple details, venue, and date before generating your page.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/wedding/details">
                <Button variant="primary">
                  Enter Wedding Details ➔
                </Button>
              </Link>
              {isError && (
                <Button variant="ghost" onClick={() => refetch()}>
                  Retry Loading 🔄
                </Button>
              )}
            </div>
            {isError && error && (
              <p className="text-xs text-[#C62828] max-w-md mx-auto">{error.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">

            {/* Details Summary Card */}
            <div className="card-royal p-6 sm:p-8 bg-white border border-[#EADCC9]">
              <div className="flex items-center justify-between border-b border-[#EADCC9] pb-4 mb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#7A1E3A]">
                    Submitted Information Summary
                  </h2>
                  <p className="text-xs text-[#7A7A7A]">
                    Verify the details that AI will use to build your page
                  </p>
                </div>
                <Link to="/wedding/details">
                  <Button variant="ghost" size="sm">
                    Edit Details ✎
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADCC9]">
                  <span className="text-xs text-[#7A7A7A] uppercase font-bold block mb-1">
                    Couple
                  </span>
                  <p className="font-serif font-bold text-base text-[#7A1E3A]">
                    {wedding.brideName} & {wedding.groomName}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADCC9]">
                  <span className="text-xs text-[#7A7A7A] uppercase font-bold block mb-1">
                    Wedding Date
                  </span>
                  <p className="font-semibold text-sm text-[#2B2B2B]">
                    {wedding.weddingDate ? new Date(wedding.weddingDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) : 'Not set'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADCC9]">
                  <span className="text-xs text-[#7A7A7A] uppercase font-bold block mb-1">
                    Grand Venue
                  </span>
                  <p className="font-semibold text-sm text-[#2B2B2B] truncate">
                    {wedding.venue || 'Not set'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADCC9]">
                  <span className="text-xs text-[#7A7A7A] uppercase font-bold block mb-1">
                    Portrait Photo
                  </span>
                  {wedding.photoUrl || wedding.photo ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={wedding.photoUrl || wedding.photo}
                        alt="Portrait Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-[#C9A24B] shrink-0"
                      />
                      <p className="font-semibold text-sm text-[#2B2B2B]">✓ Uploaded</p>
                    </div>
                  ) : (
                    <p className="font-semibold text-sm text-[#2B2B2B]">None</p>
                  )}
                </div>
              </div>

              {wedding.story && (
                <div className="mt-4 p-4 rounded-xl bg-[#FFF9F2]/50 border border-[#EADCC9]">
                  <span className="text-xs text-[#7A7A7A] uppercase font-bold block mb-1">
                    Love Story Excerpt
                  </span>
                  <p className="text-xs text-[#2B2B2B] italic line-clamp-2">
                    "{wedding.story}"
                  </p>
                </div>
              )}
            </div>

            {/* AI Generation State Box — UI state pure generationStatus se aata hai */}
            <div className="card-royal p-8 sm:p-12 text-center bg-white border border-[#C9A24B]">
              {status === 'generating' ? (
                /* GENERATING state — browser refresh ya page pe wapas aane par bhi dikhta rahega */
                <div className="py-8 space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#C9A24B] border-t-[#7A1E3A] animate-spin" />
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-bold text-[#7A1E3A] animate-pulse">
                      AI is designing your page…
                    </h3>
                    <p className="text-sm text-[#7A7A7A] max-w-md mx-auto">
                      AI is building your page, this may take 1-2 minutes...
                    </p>
                  </div>
                </div>
              ) : status === 'failed' ? (
                /* FAILED state: generationError banner + Retry. Purana page hona par bhi Ready NA dikhta */
                <div className="py-4 space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF9F2] text-[#C62828] border-2 border-[#C62828] flex items-center justify-center text-3xl shadow-sm">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#7A1E3A]">
                      Generation Failed
                    </h3>
                    <p className="text-sm text-[#7A7A7A] mt-1 max-w-md mx-auto">
                      Please try again or come back in a little while.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-red-50 text-[#C62828] text-xs font-medium max-w-md mx-auto border border-red-200">
                    {bannerError}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleGenerate}
                      disabled={submitting}
                      loading={submitting}
                      className="px-10 py-3.5 shadow-xl text-base"
                    >
                      Retry Generation 🔄
                    </Button>
                  </div>
                </div>
              ) : status === 'done' || hasPage ? (
                /* DONE state (ya legacy 'idle' with page): Ready */
                <div className="py-4 space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32] flex items-center justify-center text-3xl">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#7A1E3A]">
                      Your Wedding Page is Ready!
                    </h3>
                    <p className="text-sm text-[#7A7A7A] mt-1 max-w-md mx-auto">
                      AI has generated your wedding page. You can now preview and share it.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    {postError && (
                      <div className="p-3 rounded-xl bg-red-50 text-[#C62828] text-xs font-medium max-w-md mx-auto border border-red-200 w-full sm:w-auto">
                        {postError}
                      </div>
                    )}
                    <Link to="/wedding/preview">
                      <Button variant="primary" size="lg">
                        View My Page 👁️
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleGenerate}
                      disabled={submitting}
                      loading={submitting}
                    >
                      Regenerate Page 🔄
                    </Button>
                  </div>
                </div>
              ) : (
                /* IDLE state (koi page nahi): Generate button */
                <div className="py-4 space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF9F2] text-[#C9A24B] border-2 border-[#C9A24B] flex items-center justify-center text-3xl shadow-sm">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#7A1E3A]">
                      Ready to Build Your Digital Invitation?
                    </h3>
                    <p className="text-sm text-[#7A7A7A] mt-1 max-w-md mx-auto">
                      Click the button below to allow our AI to generate a complete responsive wedding website.
                    </p>
                  </div>

                  {postError && (
                    <div className="p-3 rounded-xl bg-red-50 text-[#C62828] text-xs font-medium max-w-md mx-auto border border-red-200">
                      {postError}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleGenerate}
                      disabled={submitting}
                      loading={submitting}
                      className="px-10 py-3.5 shadow-xl text-base"
                    >
                      {postError ? 'Retry Generation 🔄' : 'Generate My Wedding Page ✨'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
