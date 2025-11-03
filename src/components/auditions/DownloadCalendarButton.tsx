'use client';

import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { generateProductionCalendar } from '@/lib/supabase/productionTeamMembers';
import { downloadICSFile } from '@/lib/utils/calendarUtils';

interface DownloadCalendarButtonProps {
  auditionId: string;
  showTitle?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DownloadCalendarButton({
  auditionId,
  showTitle = 'Production',
  variant = 'secondary',
  size = 'md',
  className = '',
}: DownloadCalendarButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Generate the calendar
      const { data: icsContent, error: calendarError } = await generateProductionCalendar(auditionId);

      if (calendarError || !icsContent) {
        throw new Error(calendarError?.message || 'Failed to generate calendar');
      }

      // Download the file
      const filename = `${showTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-calendar.ics`;
      downloadICSFile(icsContent, filename);
    } catch (err: any) {
      console.error('Error downloading calendar:', err);
      setError(err.message || 'Failed to download calendar');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setDownloading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const variantClasses = {
    primary: `
      bg-[var(--neu-surface)] text-[var(--neu-text-primary)]
      shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)]
      hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)]
      active:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)]
      hover:text-[var(--neu-accent-primary)]
      border border-[var(--neu-border)]
      hover:border-[var(--neu-border-focus)]
    `,
    secondary: `
      bg-[var(--neu-surface)] text-[var(--neu-text-primary)]
      shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)]
      hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)]
      hover:text-[var(--neu-accent-primary)]
      border border-[var(--neu-border)]
      hover:border-[var(--neu-border-focus)]
    `,
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`
          rounded-xl font-medium transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title="Download calendar with all production dates"
      >
        {downloading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Calendar size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
            <span>Download Calendar</span>
            <Download size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs z-10">
          {error}
        </div>
      )}
    </div>
  );
}
