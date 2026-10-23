// Ye component reusable input field aur textarea render karta hai with error handling aur labels
import React from 'react';

export default function Input({
  label,
  id,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  helperText = '',
  ...props
}) {
  // Input base styles: rounded-xl, subtle gold border on focus
  const baseInputStyles = `w-full px-4 py-3 rounded-xl border bg-white text-[#2B2B2B] placeholder-gray-400 text-sm transition-all duration-200 outline-none
    ${error ? 'border-[#C62828] focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20' : 'border-[#EADCC9] focus:border-[#C9A24B] focus:ring-2 focus:ring-[#C9A24B]/20'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'hover:border-[#C9A24B]/70'}
  `;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {/* Label section */}
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#2B2B2B] flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-[#C62828] ml-1">*</span>}
          </span>
        </label>
      )}

      {/* Agar type='textarea' hai to textarea render karo, warna standard input */}
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseInputStyles} resize-y`}
          {...props}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={baseInputStyles}
          {...props}
        />
      )}

      {/* Helper text ya validation error message display */}
      {error ? (
        <p className="text-xs text-[#C62828] font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#7A7A7A] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
