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
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          {label}
          {props.required && <span className="text-neu-accent-danger ml-1">*</span>}
        </label>
      )}
      <select
        className={`neu-input ${
          error ? 'border-neu-accent-danger' : ''
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
        <p className="text-neu-accent-danger text-xs mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-neu-text-muted text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
