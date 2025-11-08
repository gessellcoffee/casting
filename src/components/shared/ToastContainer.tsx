'use client';

import { useToast } from '@/contexts/ToastContext';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-20 right-4 z-[10000] space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  };
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Color schemes for different toast types
  const typeStyles = {
    success: 'bg-green-500/90 border-green-400/50 text-white',
    error: 'bg-red-500/90 border-red-400/50 text-white',
    warning: 'bg-yellow-500/90 border-yellow-400/50 text-white',
    info: 'bg-blue-500/90 border-blue-400/50 text-white',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        pointer-events-auto
        min-w-[300px] max-w-[400px]
        px-4 py-3 rounded-lg
        border-2
        shadow-lg
        flex items-start gap-3
        transition-all duration-300 ease-out
        ${typeStyles[toast.type]}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
        {iconMap[toast.type]}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-xs"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
