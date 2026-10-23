// Ye component single toast notification popup ko render karta hai
import React from 'react';

export default function Toast({ toast, onClose }) {
  const { message, type } = toast;

  // Notification type ke according background aur border colors
  let typeStyles = 'bg-white border-[#C9A24B] text-[#2B2B2B]';
  let icon = 'ℹ️';

  if (type === 'success') {
    typeStyles = 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]';
    icon = '✓';
  } else if (type === 'error') {
    typeStyles = 'bg-[#FFEBEE] border-[#C62828] text-[#C62828]';
    icon = '✕';
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 max-w-sm w-full ${typeStyles}`}
      role="alert"
    >
      <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm bg-white/60">
        {icon}
      </span>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-800 text-sm font-bold p-1 transition-colors"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
