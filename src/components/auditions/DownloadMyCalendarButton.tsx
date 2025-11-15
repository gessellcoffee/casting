'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { generateUserCalendarEvents, generateICSFile, downloadICSFile, type UserAuditionData } from '@/lib/utils/calendarUtils';

interface DownloadMyCalendarButtonProps {
  signups: any[];
  callbacks: any[];
  productionEvents: any[];
}

export default function DownloadMyCalendarButton({
  signups,
  callbacks,
  productionEvents,
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

  const totalEvents = signups.length + callbacks.length + productionEvents.length;

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={downloading || totalEvents === 0}
        className="n-button-primary flex items-center gap-2"
        title={totalEvents === 0 ? 'No events to download' : 'Download all your auditions and performances to your calendar'}
      >
        {downloading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>Download My Calendar</span>
            {totalEvents > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-neu-accent-primary/20 text-neu-accent-primary text-sm font-semibold">
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
