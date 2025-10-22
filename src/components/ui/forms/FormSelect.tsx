import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

export default function FormSelect({ 
  label, 
  error, 
  helperText,
  options,
  children,
  className = '',
  ...props 
}: FormSelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#b5ccff] mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-red-500/50' : ''
        } ${className}`}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[#b5ccff]/60 text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
