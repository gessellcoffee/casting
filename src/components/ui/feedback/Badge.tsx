import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neu-surface border-neu-border text-neu-text-secondary',
  success: 'bg-neu-surface border-neu-border text-neu-accent-success',
  warning: 'bg-neu-surface border-neu-border text-neu-accent-warning',
  danger: 'bg-neu-surface border-neu-border text-neu-accent-danger',
  info: 'bg-neu-surface border-neu-border text-neu-accent-primary',
};

export default function Badge({ 
  variant = 'default', 
  children,
  className = '' 
}: BadgeProps) {
  return (
    <span
      className={`neu-badge ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
