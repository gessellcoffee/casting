import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div
        className={`inline-block animate-spin rounded-full border-b-2 border-[#5a8ff5] ${sizeClasses[size]}`}
      ></div>
      {message && (
        <p className="mt-4 text-neu-text-primary/70">{message}</p>
      )}
    </div>
  );
}
