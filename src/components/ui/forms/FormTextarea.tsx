import React from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function FormTextarea({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}: FormTextareaProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 rounded-xl bg-neu-surface  border-neu-border text-neu-text-primary placeholder-neu-text-muted focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-red-500/50' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-neu-text-primary/60 text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
