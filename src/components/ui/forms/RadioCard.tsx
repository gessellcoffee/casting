import React from 'react';

interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  disabled = false,
  children,
}: RadioCardProps) {
  return (
    <label
      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
        checked
          ? 'border-[#5a8ff5] bg-[#5a8ff5]/10'
          : 'border-[#4a7bd9]/20 hover:border-[#4a7bd9]/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-4 h-4 text-[#5a8ff5] focus:ring-[#5a8ff5]"
        />
        <div className="ml-3 flex-1">
          <div className="text-[#c5ddff] font-medium">{title}</div>
          {description && (
            <div className="text-[#c5ddff]/60 text-sm">{description}</div>
          )}
          {children}
        </div>
      </div>
    </label>
  );
}
