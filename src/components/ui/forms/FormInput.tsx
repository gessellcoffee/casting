import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function FormInput({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}: FormInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          {label}
          {props.required && <span className="text-neu-accent-danger ml-1">*</span>}
        </label>
      )}
      <input
        className={`neu-input ${
          error ? 'border-neu-accent-danger' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-neu-accent-danger text-xs mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-neu-text-muted text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
