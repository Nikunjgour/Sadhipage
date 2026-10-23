// Ye component animated loading spinner dikhata hai jab data fetch ho raha ho
import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  // Size classes define karte hain
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      {/* Animated dual-color spinning ring (Maroon aur Gold) */}
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-[#C9A24B] border-t-[#7A1E3A] animate-spin`}
        role="status"
        aria-label="loading"
      />
      {message && (
        <p className="text-sm font-medium text-[#7A7A7A] animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
