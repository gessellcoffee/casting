import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mb-4">
          {typeof icon === 'string' ? (
            <div className="text-6xl">{icon}</div>
          ) : (
            icon
          )}
        </div>
      )}
      <h2 className="text-2xl font-semibold text-[#c5ddff] mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-[#c5ddff]/70 mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
