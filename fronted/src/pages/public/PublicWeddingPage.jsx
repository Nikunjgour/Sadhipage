// Ye component guests ke liye public wedding page ko shareSlug ke zariye display karta hai aur RSVP handle karta hai
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicWedding, submitRsvp } from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { injectRsvpHarness, useRsvpRelay } from '../../utils/rsvpHtml';

export default function PublicWeddingPage() {
  const { shareSlug } = useParams();
  const navigate = useNavigate();

  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const iframeRef = useRef(null);

  // Slug ke aadhar par wedding data fetch karte hain
  useEffect(() => {
    async function fetchWeddingData() {
      try {
        setLoading(true);
        const data = await getPublicWedding(shareSlug);
        setWedding(data.wedding || data);
      } catch (err) {
        console.error('Error fetching public wedding page:', err);
        // Agar 404 hai to not found pe navigate karo
        if (err.status === 404) {
          navigate('/not-found', { replace: true });
          return;
        }
        // Agar isPublic false ya 403 hai to private page par bhej do
        if (err.status === 403 || (err.data && err.data.isPublic === false)) {
          navigate('/private', { replace: true });
          return;
        }
        setErrorStatus(err.message || 'Page load karne me asafal');
      } finally {
        setLoading(false);
      }
    }

    if (shareSlug) {
      fetchWeddingData();
    }
  }, [shareSlug, navigate]);

  // Single RSVP path: iframe harness posts SHAADI_RSVP_SUBMIT, this page
  // submits via the Axios client and relays SHAADI_RSVP_RESULT back.
  useRsvpRelay(iframeRef, shareSlug, submitRsvp);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F2]">
        <LoadingSpinner message="Shaadi ka page load ho raha hai..." size="lg" />
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FFF9F2] text-center">
        <div className="card-royal max-w-md p-8">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="font-serif text-2xl font-bold text-[#7A1E3A] mb-2">
            Page Load Nahi Ho Saka
          </h2>
          <p className="text-sm text-[#7A7A7A] mb-6">{errorStatus}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl bg-[#7A1E3A] text-white font-medium hover:bg-[#5A1429] transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Agar AI generated HTML available hai to usse iframe ke through seamlessly render karte hain
  const rawHtml = wedding?.generatedHTML || wedding?.html;

  // Rsvp harness render-time par inject hota hai; generated HTML me koi backend
  // URL ya fetch logic bake nahi hota.
  const htmlContent = injectRsvpHarness(rawHtml);

  if (htmlContent) {
    return (
      <div className="w-full h-screen overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          title={`${wedding?.brideName || 'Bride'} & ${wedding?.groomName || 'Groom'}'s Wedding`}
          srcDoc={htmlContent}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-forms allow-popups"
        />
      </div>
    );
  }

  // Fallback view agar generatedHTML abhi ban raha ho ya available na ho
  return (
    <div className="min-h-screen bg-[#FFF9F2] flex flex-col items-center justify-center p-6 text-center">
      <div className="card-royal max-w-xl p-10 border border-[#C9A24B]">
        <div className="text-4xl mb-4">💍</div>
        <p className="text-xs uppercase tracking-widest text-[#C9A24B] font-bold mb-2">
          Royal Wedding Celebration
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#7A1E3A] mb-4">
          {wedding?.brideName || 'Bride'} & {wedding?.groomName || 'Groom'}
        </h1>
        {wedding?.weddingDate && (
          <p className="text-base font-semibold text-[#7A1E3A] mb-3">
            📅 {new Date(wedding.weddingDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        {wedding?.venue && (
          <p className="text-sm text-[#7A7A7A] mb-6">
            📍 {wedding.venue}
          </p>
        )}
        {wedding?.story && (
          <div className="p-4 bg-[#FFF9F2] rounded-xl border border-[#EADCC9] mb-6 text-sm text-[#2B2B2B] italic">
            "{wedding.story}"
          </div>
        )}
        <p className="text-xs text-[#7A7A7A]">
          Page design is currently being finalized.
        </p>
      </div>
    </div>
  );
}
