import React from 'react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-red-500/10 border-red-500/30 text-red-300',
  success: 'bg-green-500/10 border-green-500/30 text-green-300',
  warning: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  info: 'bg-[#5a8ff5]/10 border-neu-border-focus text-neu-text-primary',
};

export default function Alert({ 
  variant = 'info', 
  children, 
  onClose,
  className = '' 
}: AlertProps) {
  return (
    <div
      className={`p-4 rounded-xl border shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="n-button-primary"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
