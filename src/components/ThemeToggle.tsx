'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <button
        className="neu-icon-btn"
        disabled
        aria-label="Loading theme"
      >
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="neu-icon-btn group relative"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 transition-transform group-hover:scale-110" />
      ) : (
        <Sun className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-90" />
      )}
    </button>
  );
}
