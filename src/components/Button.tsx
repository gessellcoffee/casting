import React from "react";
import Link from "next/link";

interface ButtonProps {
  text?: string;
  children?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  title?: string;
}

export default function Button({ 
  text,
  children,
  href, 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  variant = 'primary',
  title
}: ButtonProps) {
  // Build neumorphic button classes
  const baseClasses = `n-button-${variant}`;
  const combinedClasses = `${baseClasses} ${className}`.trim();
  
  // Use children if provided, otherwise use text
  const content = children || text;

  // If href is provided, render as Link wrapped in button for neumorphic styling
  if (href && !onClick) {
    return (
      <Link href={href}>
        <button className={combinedClasses} disabled={disabled} title={title}>
          {content}
        </button>
      </Link>
    );
  }

  // Otherwise render as button with onClick
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      title={title}
    >
      {content}
    </button>
  );
}