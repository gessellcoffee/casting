import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  href?: string;
  className?: string;
  showText?: boolean;
}

export default function Logo({ 
  size = 40, 
  href = '/', 
  className = '',
  showText = true 
}: LogoProps) {
  const logoImage = (
    <div 
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ 
        width: size, 
        height: size,
        flexShrink: 0
      }}
    >
      <Image
        src="/icon.png"
        alt="Belong Here Theater Logo"
        width={size}
        height={size}
        className="object-cover"
        priority
      />
    </div>
  );

  const content = showText ? (
    <div className="flex items-center gap-3">
      {logoImage}
      <span className="font-semibold">Belong Here Theater</span>
    </div>
  ) : logoImage;

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
