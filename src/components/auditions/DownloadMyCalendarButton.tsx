'use client';

import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { generateUserCalendarEvents, generateICSFile, downloadICSFile, type UserAuditionData } from '@/lib/utils/calendarUtils';

interface DownloadMyCalendarButtonProps {
  signups: any[];
  callbacks: any[];
  productionEvents: any[];
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DownloadMyCalendarButton({
  signups,
  callbacks,
  productionEvents,
  variant = 'primary',
  size = 'md',
  className = '',
}: DownloadMyCalendarButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Prepare the data
      const calendarData: UserAuditionData = {
        signups,
        callbacks,
        productionEvents,
      };

      // Generate calendar events
      const events = generateUserCalendarEvents(calendarData);

      if (events.length === 0) {
        throw new Error('No events to add to calendar. Sign up for auditions first!');
      }

      // Generate ICS file
      const icsContent = generateICSFile(events, 'My Audition Calendar');

      // Download the file
      downloadICSFile(icsContent, 'my-auditions.ics');
    } catch (err: any) {
      console.error('Error downloading calendar:', err);
      setError(err.message || 'Failed to download calendar');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
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

  const totalEvents = signups.length + callbacks.length + productionEvents.length;

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={downloading || totalEvents === 0}
        className={`
          n-button-primary inline
        `}
        title={totalEvents === 0 ? 'No events to download' : 'Download all your auditions and performances to your calendar'}
      >
        {downloading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Calendar size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
            <span>Download My Calendar</span>
            <Download size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
            {totalEvents > 0 && (
              <span className="">
                {totalEvents}
              </span>
            )}
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm z-10 shadow-lg">
          {error}
        </div>
      )}
      
      {/* Empty state hint */}
      {totalEvents === 0 && !downloading && (
        <div className="">
          Sign up for auditions to enable calendar download
        </div>
      )}
    </div>
  );
}
