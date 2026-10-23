// Ye component reusable popup dialog/modal provide karta hai (e.g. confirmations, forms)
import React, { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg', // 'max-w-md' | 'max-w-lg' | 'max-w-2xl' | 'max-w-4xl'
}) {
  // ESC key dabane par modal close ho jaye
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card Content */}
      <div
        className={`relative bg-white rounded-2xl border border-[#C9A24B]/40 shadow-2xl w-full ${maxWidth} z-10 overflow-hidden transform transition-all my-8`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EADCC9] bg-[#FFF9F2]/60">
          <h3 className="font-serif text-xl font-bold text-[#7A1E3A]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#7A1E3A] rounded-full p-1 transition-colors text-lg font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 text-[#2B2B2B] max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
