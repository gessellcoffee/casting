'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import Button from '@/components/Button';
import { generateCallSheetPDF, downloadPDF, ShowDetails } from '@/lib/utils/pdfExport';

interface DownloadCallSheetButtonProps {
  rehearsalEvent: {
    date: string;
    start_time: string;
    end_time: string;
    location?: string;
    notes?: string;
  };
  showDetails: ShowDetails;
  agendaItems: Array<{
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    assignments: Array<{
      user_id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      role_name?: string;
      status: string;
    }>;
  }>;
}

export default function DownloadCallSheetButton({
  rehearsalEvent,
  showDetails,
  agendaItems,
}: DownloadCallSheetButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      // Generate call sheet PDF
      const doc = generateCallSheetPDF(rehearsalEvent, showDetails, agendaItems);

      // Download the PDF
      const dateStr = rehearsalEvent.date.replace(/-/g, '_');
      const filename = `${showDetails.title.replace(/[^a-z0-9]/gi, '_')}_call_sheet_${dateStr}.pdf`;
      downloadPDF(doc, filename);

    } catch (err: any) {
      console.error('Error generating call sheet:', err);
      setError(err.message || 'Failed to generate call sheet');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleDownload}
        disabled={downloading}
        variant="primary"
        className="flex items-center gap-2"
        title="Download call sheet for this rehearsal"
      >
        {downloading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FileText size={18} />
            <span>Download Call Sheet</span>
          </>
        )}
      </Button>

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm z-10 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
