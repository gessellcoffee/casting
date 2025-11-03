'use client';

import type { CastStatus } from '@/lib/supabase/types';

interface OfferStatusBadgeProps {
  status: CastStatus | null;
  className?: string;
}

export default function OfferStatusBadge({ status, className = '' }: OfferStatusBadgeProps) {
  if (!status) return null;

  const getStatusStyles = () => {
    switch (status) {
      case 'Offered':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          label: 'Pending',
        };
      case 'Accepted':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          label: 'Accepted',
        };
      case 'Declined':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          label: 'Declined',
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          label: status,
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {styles.label}
    </span>
  );
}
