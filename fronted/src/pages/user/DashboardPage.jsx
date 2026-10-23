// Ye component logged-in user ka main dashboard render karta hai jahan wedding status, progress stepper, aur quick action buttons hote hain
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// NEW: TanStack Query hook use kiya automated caching aur state management ke liye
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getMyWedding, getWeddingRsvps } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  // CHANGED: useEffect ki jagah TanStack useQuery hook use kiya
  const {
    data: wedding,
    isLoading: loading,
  } = useQuery({
    // staleTime 0 + refetchOnMount 'always': page khulte hi sabse naya
    // generatedHTML aata hai (purane cached page turant nahi dikhega)
    queryKey: ['myWedding'],
    staleTime: 0,
    refetchOnMount: 'always',
    // Background generation status polling: sirf 'generating' par har 4s refetch
    refetchInterval: (query) =>
      query.state.data?.generationStatus === 'generating' ? 4000 : false,
    queryFn: async () => {
      try {
        const res = await getMyWedding();
        return res.wedding || res.data?.wedding || res;
      } catch (err) {
        // 404 ka matlab user ne abhi tak wedding details create nahi ki hai
        if (err.status === 404) {
          return null;
        }
        throw err;
      }
    },
  });

  // Logged-in wedding owner ke received RSVPs fetch karte hain
  const {
    data: rsvpResult,
    isLoading: rsvpLoading,
    refetch: refetchRsvps,
  } = useQuery({
    queryKey: ['myWeddingRsvps'],
    queryFn: async () => {
      try {
        const res = await getWeddingRsvps();
        return res.data || res;
      } catch (err) {
        return { rsvps: [], stats: { total: 0, attendingCount: 0, declinedCount: 0, totalGuests: 0 } };
      }
    },
    enabled: !!wedding,
  });

  const rsvps = rsvpResult?.rsvps || wedding?.rsvps || [];
  const stats = rsvpResult?.stats || {
    total: rsvps.length,
    attendingCount: rsvps.filter((r) => r.attending === 'yes' || r.attending === 'attending').length,
    declinedCount: rsvps.filter((r) => r.attending === 'no' || r.attending === 'declined').length,
    totalGuests: rsvps.reduce((acc, curr) => acc + (curr.guestCount || 0), 0),
  };

  // Status calculation: 'NOT_CREATED', 'DETAILS_SAVED', 'PAGE_GENERATED'
  let currentStatus = 'NOT_CREATED';
  let stepIndex = 1;

  if (wedding && (wedding._id || wedding.id || wedding.brideName)) {
    if (wedding.generatedHTML || wedding.html) {
      currentStatus = 'PAGE_GENERATED';
      stepIndex = 3;
    } else {
      currentStatus = 'DETAILS_SAVED';
      stepIndex = 2;
    }
  }

  // Background generation job chal raha hai — status khud widget banaata hai
  const isGenerating = wedding?.generationStatus === 'generating';

  // Public share link generate karna
  const shareSlug = wedding?.shareSlug || wedding?.slug || wedding?._id || wedding?.id;
  const publicShareUrl = shareSlug ? `${window.location.origin}/w/${shareSlug}` : '';

  // Share link copy karne ka handler
  const handleCopyLink = () => {
    if (!publicShareUrl) return;
    navigator.clipboard.writeText(publicShareUrl);
    setCopied(true);
    addToast('Wedding link clipboard me copy ho gaya! ✨', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF9F2]">
      {/* User Dashboard Sidebar */}
      <Sidebar variant="user" />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Welcome Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#7A1E3A]">
              Namaste, {user?.name || 'Friend'}! 🌸
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Welcome to your personal Royal Wedding control center.
            </p>
          </div>

          {currentStatus === 'PAGE_GENERATED' && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyLink}
                icon={copied ? '✓' : '🔗'}
              >
                {copied ? 'Copied!' : 'Copy Share Link'}
              </Button>
              <Link to="/wedding/preview">
                <Button variant="primary" size="sm">
                  View Live Page ➔
                </Button>
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <div className="card-royal p-12 flex justify-center">
            <LoadingSpinner message="Checking wedding details..." />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Status Card */}
            <div className="card-royal p-6 sm:p-8 border-l-4 border-l-[#C9A24B] bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF9F2] border border-[#C9A24B] flex items-center justify-center text-3xl shadow-xs shrink-0">
                    {currentStatus === 'PAGE_GENERATED' ? '🎉' : currentStatus === 'DETAILS_SAVED' ? '📝' : '✨'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#C9A24B]">
                        Current Stage
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isGenerating
                          ? 'bg-amber-100 text-amber-800'
                          : currentStatus === 'PAGE_GENERATED'
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : currentStatus === 'DETAILS_SAVED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isGenerating
                          ? 'Generating...'
                          : currentStatus === 'PAGE_GENERATED'
                          ? 'Page Generated & Live'
                          : currentStatus === 'DETAILS_SAVED'
                          ? 'Details Saved'
                          : 'Not Created Yet'}
                      </span>
                      {isGenerating && (
                        <span className="text-xs font-semibold text-[#7A1E3A] animate-pulse">
                          AI page bana raha hai, yeh status khud update ho jayega...
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-2xl font-bold text-[#7A1E3A] mt-1">
                      {currentStatus === 'PAGE_GENERATED'
                        ? `${wedding?.brideName} & ${wedding?.groomName}'s Royal Page`
                        : currentStatus === 'DETAILS_SAVED'
                        ? 'Wedding Information Ready for AI Generation'
                        : 'Start Your Wedding Invitation Website'}
                    </h2>

                    <p className="text-sm text-[#7A7A7A] mt-1 max-w-2xl">
                      {currentStatus === 'PAGE_GENERATED'
                        ? 'Aapka wedding page safalta-poorvak generate ho chuka hai. Aap ise preview kar sakte hain ya guests ke sath share kar sakte hain.'
                        : currentStatus === 'DETAILS_SAVED'
                        ? 'Aapne basic details save kar li hain! Ab AI Generation page par jakar apna royal theme wedding page banayein.'
                        : 'Pehla kadam: Apni wedding details (Dulha, Dulhan, Date, Venue aur Love Story) fill karein.'}
                    </p>
                  </div>
                </div>

                {/* Status Quick CTA */}
                <div className="sm:self-center shrink-0">
                  {currentStatus === 'NOT_CREATED' && (
                    <Link to="/wedding/details">
                      <Button variant="primary" size="md">
                        Fill Wedding Details ➔
                      </Button>
                    </Link>
                  )}
                  {currentStatus === 'DETAILS_SAVED' && (
                    <Link to="/wedding/generate">
                      <Button variant="primary" size="md">
                        Generate Page Now ✨
                      </Button>
                    </Link>
                  )}
                  {currentStatus === 'PAGE_GENERATED' && (
                    <Link to="/wedding/preview">
                      <Button variant="secondary" size="md">
                        Open Preview 👁️
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="card-royal p-6 sm:p-8 bg-white">
              <h3 className="font-serif text-xl font-bold text-[#7A1E3A] mb-6">
                Your Wedding Launch Progress
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                
                {/* Step 1 */}
                <div className={`p-5 rounded-xl border transition-all ${
                  stepIndex >= 1
                    ? 'border-[#C9A24B] bg-[#FFF9F2]/70'
                    : 'border-[#EADCC9] bg-white opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      stepIndex > 1
                        ? 'bg-[#2E7D32] text-white'
                        : 'bg-[#7A1E3A] text-white'
                    }`}>
                      {stepIndex > 1 ? '✓' : '1'}
                    </span>
                    <span className="text-xs font-semibold text-[#7A7A7A]">Step 1</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#7A1E3A]">
                    Fill Details
                  </h4>
                  <p className="text-xs text-[#7A7A7A] mt-1 leading-relaxed">
                    Couple details, wedding date, venue, photo & story submit karein.
                  </p>
                  <div className="mt-4">
                    <Link to="/wedding/details" className="text-xs font-bold text-[#7A1E3A] hover:underline">
                      {currentStatus === 'NOT_CREATED' ? 'Fill Details Now ➔' : 'Edit Details ✎'}
                    </Link>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-5 rounded-xl border transition-all ${
                  stepIndex >= 2
                    ? 'border-[#C9A24B] bg-[#FFF9F2]/70'
                    : 'border-[#EADCC9] bg-white opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      stepIndex > 2
                        ? 'bg-[#2E7D32] text-white'
                        : stepIndex === 2
                        ? 'bg-[#7A1E3A] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stepIndex > 2 ? '✓' : '2'}
                    </span>
                    <span className="text-xs font-semibold text-[#7A7A7A]">Step 2</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#7A1E3A]">
                    AI Generation
                  </h4>
                  <p className="text-xs text-[#7A7A7A] mt-1 leading-relaxed">
                    AI engine aapke data ko Royal Vows theme me convert karta hai.
                  </p>
                  <div className="mt-4">
                    <Link
                      to="/wedding/generate"
                      className={`text-xs font-bold ${
                        currentStatus === 'NOT_CREATED' ? 'text-gray-400 pointer-events-none' : 'text-[#7A1E3A] hover:underline'
                      }`}
                    >
                      {currentStatus === 'PAGE_GENERATED' ? 'Regenerate Page ➔' : 'Run Generator ✨'}
                    </Link>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`p-5 rounded-xl border transition-all ${
                  stepIndex >= 3
                    ? 'border-[#C9A24B] bg-[#FFF9F2]/70'
                    : 'border-[#EADCC9] bg-white opacity-60'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      stepIndex === 3
                        ? 'bg-[#2E7D32] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {stepIndex === 3 ? '✓' : '3'}
                    </span>
                    <span className="text-xs font-semibold text-[#7A7A7A]">Step 3</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#7A1E3A]">
                    Share & Celebrate
                  </h4>
                  <p className="text-xs text-[#7A7A7A] mt-1 leading-relaxed">
                    Preview desktop/mobile layouts, copy invitation link & invite guests.
                  </p>
                  <div className="mt-4">
                    <Link
                      to="/wedding/preview"
                      className={`text-xs font-bold ${
                        currentStatus !== 'PAGE_GENERATED' ? 'text-gray-400 pointer-events-none' : 'text-[#7A1E3A] hover:underline'
                      }`}
                    >
                      View Preview ➔
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Actions & Detail Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Quick Actions */}
              <div className="card-royal p-6 bg-white space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#7A1E3A]">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/wedding/details">
                    <button className="w-full text-left p-3.5 rounded-xl border border-[#EADCC9] hover:border-[#C9A24B] hover:bg-[#FFF9F2] transition-colors flex flex-col gap-1 cursor-pointer">
                      <span className="text-xl">📝</span>
                      <span className="text-xs font-bold text-[#7A1E3A]">Edit Details</span>
                      <span className="text-[11px] text-[#7A7A7A]">Update venue or date</span>
                    </button>
                  </Link>

                  <Link to="/wedding/generate">
                    <button className="w-full text-left p-3.5 rounded-xl border border-[#EADCC9] hover:border-[#C9A24B] hover:bg-[#FFF9F2] transition-colors flex flex-col gap-1 cursor-pointer">
                      <span className="text-xl">✨</span>
                      <span className="text-xs font-bold text-[#7A1E3A]">AI Design Engine</span>
                      <span className="text-[11px] text-[#7A7A7A]">Regenerate template</span>
                    </button>
                  </Link>

                  <Link to="/wedding/preview">
                    <button className="w-full text-left p-3.5 rounded-xl border border-[#EADCC9] hover:border-[#C9A24B] hover:bg-[#FFF9F2] transition-colors flex flex-col gap-1 cursor-pointer">
                      <span className="text-xl">📱</span>
                      <span className="text-xs font-bold text-[#7A1E3A]">Live Preview</span>
                      <span className="text-[11px] text-[#7A7A7A]">Mobile & desktop test</span>
                    </button>
                  </Link>

                  <Link to="/profile">
                    <button className="w-full text-left p-3.5 rounded-xl border border-[#EADCC9] hover:border-[#C9A24B] hover:bg-[#FFF9F2] transition-colors flex flex-col gap-1 cursor-pointer">
                      <span className="text-xl">👤</span>
                      <span className="text-xs font-bold text-[#7A1E3A]">My Account</span>
                      <span className="text-[11px] text-[#7A7A7A]">Profile & settings</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Public Sharing Card */}
              <div className="card-royal p-6 bg-white flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#7A1E3A] mb-1">
                    Public Invitation Link
                  </h3>
                  <p className="text-xs text-[#7A7A7A]">
                    Aapke mehmaan is link ke dwara aapki wedding website dekh sakte hain.
                  </p>
                </div>

                {publicShareUrl ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FFF9F2] border border-[#EADCC9] rounded-xl flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs text-[#2B2B2B] truncate font-mono">
                        {publicShareUrl}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="shrink-0 px-3 py-1 bg-[#C9A24B] text-[#380213] rounded-lg text-xs font-bold hover:bg-[#b8913c] transition-colors"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={publicShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button variant="secondary" size="sm" className="w-full text-xs">
                          Open Public Link in New Tab ↗
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
                    <p className="text-xs text-[#7A7A7A]">
                      Shaadi page generate hone ke baad yahan aapka live link activate hoga.
                    </p>
                  </div>
                )}

                <div className="text-[11px] text-[#7A7A7A] italic border-t border-[#EADCC9] pt-3">
                  Tip: Copy karke WhatsApp groups ya e-invites par directly send karein!
                </div>
              </div>

            </div>

            {/* Received RSVPs & Guest List Section */}
            {currentStatus === 'PAGE_GENERATED' && (
              <div className="card-royal p-6 sm:p-8 bg-white border border-[#EADCC9] space-y-6">
                
                {/* Header & Refresh */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADCC9] pb-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#7A1E3A] flex items-center gap-2">
                      <span>💌</span>
                      <span>Guest RSVPs & Responses</span>
                    </h3>
                    <p className="text-xs text-[#7A7A7A] mt-0.5">
                      Live attendance confirmations from your guests via your public wedding link
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => refetchRsvps()}
                      className="px-3 py-1.5 rounded-lg border border-[#EADCC9] hover:bg-[#FFF9F2] text-xs font-semibold text-[#7A1E3A] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Refresh guest responses"
                    >
                      <span>🔄</span>
                      <span>Refresh</span>
                    </button>
                    {publicShareUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyLink}
                        icon={copied ? '✓' : '🔗'}
                      >
                        {copied ? 'Copied' : 'Share Link'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* RSVP Stats 4-Column Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#FFF9F2] border border-[#EADCC9]">
                    <span className="text-[11px] uppercase font-bold text-[#7A7A7A] block mb-1">
                      Total RSVPs
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#7A1E3A]">
                      {stats.total}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] uppercase font-bold text-emerald-800 block mb-1">
                      Attending
                    </span>
                    <span className="font-serif text-2xl font-bold text-emerald-700">
                      {stats.attendingCount}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[11px] uppercase font-bold text-rose-800 block mb-1">
                      Declined
                    </span>
                    <span className="font-serif text-2xl font-bold text-rose-700">
                      {stats.declinedCount}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] uppercase font-bold text-amber-800 block mb-1">
                      Expected Guests
                    </span>
                    <span className="font-serif text-2xl font-bold text-amber-800">
                      {stats.totalGuests}
                    </span>
                  </div>
                </div>

                {/* RSVPs Table / Empty State */}
                {rsvpLoading ? (
                  <div className="py-8 flex justify-center">
                    <LoadingSpinner message="Checking RSVPs..." size="sm" />
                  </div>
                ) : rsvps.length === 0 ? (
                  <div className="p-8 text-center bg-[#FFF9F2]/50 rounded-2xl border border-dashed border-[#C9A24B]/50 space-y-3">
                    <span className="text-3xl block">💌</span>
                    <h4 className="font-serif font-bold text-base text-[#7A1E3A]">
                      No RSVPs Received Yet
                    </h4>
                    <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto">
                      Share your wedding link on WhatsApp, Instagram or digital invitations to start collecting responses!
                    </p>
                    {publicShareUrl && (
                      <div className="pt-2">
                        <Button variant="primary" size="sm" onClick={handleCopyLink}>
                          Copy Invitation Link 🔗
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#EADCC9]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FFF9F2] text-[#7A1E3A] border-b border-[#EADCC9] font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Guest Name</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Party Size</th>
                          <th className="py-3 px-4 text-right">Received On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EADCC9] text-[#2B2B2B]">
                        {rsvps.map((r, i) => {
                          const isYes = r.attending === 'yes' || r.attending === 'attending';
                          return (
                            <tr key={r._id || i} className="hover:bg-[#FFF9F2]/40 transition-colors">
                              <td className="py-3 px-4 font-semibold text-[#7A1E3A]">
                                {r.name}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isYes
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                  <span>{isYes ? '✓ Attending' : '✕ Declined'}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-medium">
                                {isYes ? `${r.guestCount || 1} guest(s)` : '—'}
                              </td>
                              <td className="py-3 px-4 text-right text-[#7A7A7A]">
                                {r.createdAt
                                  ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'Recent'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
