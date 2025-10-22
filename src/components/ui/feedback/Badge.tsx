import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#2e3e5e]/80 border-[#5a8ff5]/30 text-[#c5ddff]',
  success: 'bg-green-500/20 border-green-500/30 text-green-300',
  warning: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  danger: 'bg-red-500/20 border-red-500/30 text-red-300',
  info: 'bg-[#5a8ff5]/20 border-[#5a8ff5]/30 text-[#5a8ff5]',
};

export default function Badge({ 
  variant = 'default', 
  children,
  className = '' 
}: BadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-lg border shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)] ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
