import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

/**
 * Avatar component for displaying user profile photos
 * Shows initials if no photo is available
 */
export default function Avatar({ 
  src, 
  alt = 'User', 
  size = 'md',
  onClick,
  className = ''
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = alt ? getInitials(alt) : '?';

  const baseClasses = `
    ${sizeClasses[size]}
    rounded-full
    flex items-center justify-center
    font-semibold
    transition-all duration-200
    ${onClick ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : ''}
    ${className}
  `;

  if (src) {
    return (
      <div
        onClick={onClick}
        className={`${baseClasses} overflow-hidden bg-neu-surface ring-2 ring-[#6b8dd6]/30`}
        title={alt}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback to initials with gradient background
  return (
    <div
      onClick={onClick}
      className={`${baseClasses} bg-gradient-to-br from-[#6b8dd6] to-[#8b5cf6] text-white ring-2 ring-[#6b8dd6]/30`}
      title={alt}
    >
      {initials}
    </div>
  );
}
