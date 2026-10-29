// Ye button component poore application me consistent styling aur loading state provide karta hai
import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon = null,
  // NEW: Optional custom loading label (default unchanged ke liye 'Processing...')
  loadingText = 'Processing...',
}) {
  // Base styling: rounded 12-16px (rounded-xl), transition, focus ring
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none';

  // Size styling
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base font-semibold',
  };

  // Variant styling
  // primary = maroon bg white text, secondary = gold outline
  const variantClasses = {
    primary: 'bg-[#7A1E3A] hover:bg-[#5A1429] text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#7A1E3A]/40',
    secondary: 'border-2 border-[#C9A24B] text-[#7A1E3A] bg-transparent hover:bg-[#FFF9F2] focus:ring-2 focus:ring-[#C9A24B]/30',
    danger: 'bg-[#C62828] hover:bg-[#A31F1F] text-white shadow-sm focus:ring-2 focus:ring-[#C62828]/40',
    ghost: 'text-[#7A1E3A] hover:bg-[#7A1E3A]/10 focus:ring-2 focus:ring-[#7A1E3A]/20',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
    >
      {/* Loading state me mini spinner dikhate hain */}
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>{loadingText}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
}
