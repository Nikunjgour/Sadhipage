// Rsvp harness utilities shared by the public wedding page and the owner preview.
//
// Design (single submission path, no URLs baked into generated HTML):
// 1. At render time we inject a small JS harness into the AI-generated HTML.
// 2. The harness validates the form, disables the button, and posts ONE
//    `SHAADI_RSVP_SUBMIT` message to the parent window (no direct fetch).
// 3. The parent page (via `useRsvpRelay`) checks `event.source` against the
//    iframe's contentWindow, submits through the app's Axios client
//    (`VITE_API_URL` -> `/wedding/rsvp`), and relays a `SHAADI_RSVP_RESULT`
//    message back into the iframe so the guest sees success or a clear error.
//
// Because the parent does the network call, the generated HTML never needs to
// know the backend URL, and the iframe can run without `allow-same-origin`.
import { useEffect } from 'react';

export const RSVP_SUBMIT_TYPE = 'SHAADI_RSVP_SUBMIT';
export const RSVP_RESULT_TYPE = 'SHAADI_RSVP_RESULT';

// Injected into the generated HTML at render time. Contains NO backend URL.
const rsvpHarnessScript = `
(function () {
  var submitting = false;

  function showToast(toast, text, isError) {
    if (!toast) return;
    toast.innerText = (isError ? '\\u26A0\\uFE0F ' : '') + text;
    toast.style.display = 'block';
    toast.scrollIntoView({ behavior: 'smooth' });
  }

  function setBusy(submitBtn, busy, label) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.innerText = label;
    submitBtn.style.opacity = busy ? '0.7' : '1';
    submitBtn.style.cursor = busy ? 'not-allowed' : 'pointer';
  }

  function idle(submitBtn) {
    setBusy(submitBtn, false, 'Confirm Presence');
  }

  async function handleRSVP(event) {
    if (event) {
      event.preventDefault();
      // Capture-phase listener: block the AI page's own inline onsubmit so the
      // submission logic runs exactly once.
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
    if (submitting) return false;

    var form = (event && event.target && event.target.tagName === 'FORM')
      ? event.target
      : (document.getElementById('weddingForm') || document.querySelector('form'));
    var nameInput = document.getElementById('guestName') || (form ? form.querySelector('input[type="text"]') : null);
    var attendingSelect = document.getElementById('attending') || (form ? form.querySelector('select') : null);
    var guestCountInput = document.getElementById('guestCount') || (form ? form.querySelector('input[type="number"]') : null);
    var submitBtn = form ? (form.querySelector('button[type="submit"]') || form.querySelector('.btn-submit')) : null;
    var toast = document.getElementById('toast');

    var guestName = (nameInput ? nameInput.value : '').trim();
    var attending = (attendingSelect ? attendingSelect.value : 'yes').trim().toLowerCase();
    var guestCount = guestCountInput ? parseInt(guestCountInput.value, 10) : 1;
    var isAttending = attending !== 'no' && attending !== 'declined';

    if (!guestName) {
      showToast(toast, 'Please enter your full name.', true);
      if (nameInput) nameInput.focus();
      return false;
    }

    if (isAttending && (isNaN(guestCount) || guestCount < 1)) {
      showToast(toast, 'Please specify at least 1 guest.', true);
      if (guestCountInput) guestCountInput.focus();
      return false;
    }
    if (!isAttending) guestCount = 0;

    var payload = {
      name: guestName,
      attending: isAttending ? 'yes' : 'no',
      guestCount: guestCount
    };

    setBusy(submitBtn, true, 'Confirming...');
    submitting = true;

    var hasParent = window.parent && window.parent !== window;
    if (!hasParent) {
      submitting = false;
      showToast(toast, 'RSVP is only available on the shared wedding page.', true);
      idle(submitBtn);
      return false;
    }

    // Result relay: parent answers with SHAADI_RSVP_RESULT after the API call.
    var timer = null;
    var onResult = function (ev) {
      var d = ev.data || {};
      if (d.type !== 'SHAADI_RSVP_RESULT') return;
      window.removeEventListener('message', onResult);
      if (timer) clearTimeout(timer);
      submitting = false;
      if (d.ok) {
        showToast(toast, d.message || 'Thank you, your RSVP is confirmed!');
        if (submitBtn) submitBtn.innerText = 'RSVP Confirmed \\u2713';
        if (form) form.reset();
        if (typeof triggerConfetti === 'function') {
          try { triggerConfetti(); } catch (e) {}
        }
      } else {
        showToast(toast, d.message || 'RSVP submission failed. Please try again.', true);
        idle(submitBtn);
      }
    };
    timer = setTimeout(function () {
      // Slightly longer than the parent Axios timeout (60s) so the parent's
      // relayed result always wins this race.
      window.removeEventListener('message', onResult);
      submitting = false;
      showToast(toast, 'RSVP submission timed out. Please try again.', true);
      idle(submitBtn);
    }, 65000);
    window.addEventListener('message', onResult);

    try {
      window.parent.postMessage({ type: 'SHAADI_RSVP_SUBMIT', payload: payload }, '*');
    } catch (err) {
      window.removeEventListener('message', onResult);
      if (timer) clearTimeout(timer);
      submitting = false;
      showToast(toast, 'RSVP submission failed. Please try again.', true);
      idle(submitBtn);
    }
    return false;
  }

  // Override whatever the generated page defined and capture every submit.
  window.handleRSVP = handleRSVP;
  document.addEventListener('submit', handleRSVP, true);
})();
`;

/**
 * Injects the RSVP harness into AI-generated wedding HTML at render time.
 * No regex stripping: the harness simply overrides `window.handleRSVP` and
 * attaches a single capture-phase submit listener.
 * @param {string} html - Stored generatedHTML from the backend
 * @returns {string} HTML ready for an iframe srcDoc ('' when input is empty)
 */
export function injectRsvpHarness(html) {
  if (!html) return '';
  const harness = '<script>' + rsvpHarnessScript + '</script>';
  if (html.includes('</body>')) {
    return html.replace('</body>', harness + '\n</body>');
  }
  return html + harness;
}

/**
 * Parent-side relay. Listens for RSVP submissions coming from OUR iframe only
 * (verified via event.source), submits them through the given API function,
 * and posts the outcome back into the iframe so the guest UI updates.
 * @param {React.RefObject} iframeRef - Ref bound to the preview iframe
 * @param {string|null} weddingSlug - shareSlug of the wedding being viewed
 * @param {(data: Object) => Promise<Object>} submitRsvp - API submit function
 */
export function useRsvpRelay(iframeRef, weddingSlug, submitRsvp) {
  useEffect(() => {
    if (!submitRsvp) return undefined;

    const handleMessage = async (event) => {
      const data = event.data;
      if (!data || data.type !== RSVP_SUBMIT_TYPE || !data.payload) return;

      // Security check: only accept messages posted by our own iframe.
      const frame = iframeRef ? iframeRef.current : null;
      if (!frame || event.source !== frame.contentWindow) return;

      let ok = true;
      let message = 'Thank you, your RSVP is confirmed!';
      try {
        await submitRsvp({ ...data.payload, weddingSlug });
      } catch (err) {
        ok = false;
        message = err.message || 'RSVP submission failed. Please try again.';
      }

      // Relay the result back into the iframe. The iframe has an opaque origin
      // (sandbox without allow-same-origin), so '*' is the only usable target.
      try {
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
            { type: RSVP_RESULT_TYPE, ok, message },
            '*'
          );
        }
      } catch {
        // Iframe may have navigated away; nothing to relay to.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeRef, weddingSlug, submitRsvp]);
}
