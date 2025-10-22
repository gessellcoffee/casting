import React from "react";
import Link from "next/link";

interface ButtonProps {
  text: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export default function Button({ 
  text, 
  href, 
  onClick, 
  disabled = false, 
  type = 'button',
  className = ''
}: ButtonProps) {
  // If href is provided, render as Link wrapped in button for neuromorphic styling
  if (href && !onClick) {
    return (
      <button className={className} disabled={disabled}>
        <Link href={href}>{text}</Link>
      </button>
    );
  }

  // Otherwise render as button with onClick
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {text}
    </button>
  );
}