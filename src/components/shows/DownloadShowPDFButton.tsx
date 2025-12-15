'use client';

import { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import Button from '@/components/Button';
import { generateCalendarGridPDF, generateCalendarListPDF, downloadPDF, CalendarEvent, ShowDetails } from '@/lib/utils/pdfExport';
import { ProductionDateEvent } from '@/lib/utils/calendarEvents';
import { formatUSDate, formatUSTime } from '@/lib/utils/dateUtils';

interface DownloadShowPDFButtonProps {
  events: ProductionDateEvent[];
  showDetails: ShowDetails;
  actorName: string;
  format: 'actor' | 'production';
}

export default function DownloadShowPDFButton({
  events,
  showDetails,
  actorName,
  format,
}: DownloadShowPDFButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (layoutType: 'grid' | 'list') => {
    setDownloading(true);
    setError(null);
    setShowOptions(false);

    try {
      if (events.length === 0) {
        throw new Error('No events to export');
      }

      const eventsForExport: ProductionDateEvent[] = (() => {
        // For list view, we want agenda items displayed under their parent rehearsal event,
        // not as separate cards.
        if (layoutType !== 'list') return events;

        const baseEvents = events.filter(e => e.type !== 'agenda_item');
        const agendaItems = events.filter(e => e.type === 'agenda_item');

        const agendaByRehearsalEventId = new Map<string, ProductionDateEvent[]>();
        agendaItems.forEach((a: any) => {
          if (!a?.eventId) return;
          if (!agendaByRehearsalEventId.has(a.eventId)) {
            agendaByRehearsalEventId.set(a.eventId, []);
          }
          agendaByRehearsalEventId.get(a.eventId)!.push(a);
        });

        return baseEvents.map((e: any) => {
          if (e.type !== 'rehearsal_event' || !e.eventId) return e;

          const agendaForThis = agendaByRehearsalEventId.get(e.eventId) || [];
          if (agendaForThis.length === 0) return e;

          const agendaLines = agendaForThis
            .sort((a: any, b: any) => {
              const aT = a?.startTime ? new Date(a.startTime).getTime() : 0;
              const bT = b?.startTime ? new Date(b.startTime).getTime() : 0;
              return aT - bT;
            })
            .map((a: any) => {
              const time = a.startTime && a.endTime
                ? `${formatUSTime(a.startTime.toTimeString().split(' ')[0])} - ${formatUSTime(a.endTime.toTimeString().split(' ')[0])}`
                : a.startTime
                  ? formatUSTime(a.startTime.toTimeString().split(' ')[0])
                  : '';
              const called = a.description ? ` — ${a.description}` : '';
              return `${time} ${a.title}${called}`.trim();
            });

          const agendaBlock = `Agenda:\n${agendaLines.map(l => `- ${l}`).join('\n')}`;
          const mergedDescription = e.description
            ? `${e.description}\n\n${agendaBlock}`
            : agendaBlock;

          return { ...e, description: mergedDescription };
        });
      })();

      // Convert ProductionDateEvent to CalendarEvent format
      const calendarEvents: CalendarEvent[] = eventsForExport.map(event => ({
        date: event.date.toISOString().split('T')[0],
        title: event.title,
        type: getEventTypeLabel(event.type),
        time: event.startTime && event.endTime 
          ? `${formatUSTime(event.startTime.toTimeString().split(' ')[0])} - ${formatUSTime(event.endTime.toTimeString().split(' ')[0])}`
          : undefined,
        location: event.location || undefined,
        description: event.description,
        color: getEventColor(event.type),
      }));

      // Sort events by date
      calendarEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Generate PDF based on layout type
      const doc = layoutType === 'grid'
        ? generateCalendarGridPDF(calendarEvents, showDetails, actorName, format)
        : generateCalendarListPDF(calendarEvents, showDetails, actorName, format);

      // Download the PDF
      const filename = `${showDetails.title.replace(/[^a-z0-9]/gi, '_')}_${layoutType}_calendar.pdf`;
      downloadPDF(doc, filename);

    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'rehearsal': 'Rehearsal',
      'performance': 'Performance',
      'audition_slot': 'Audition',
      'rehearsal_event': 'Rehearsal',
      'agenda_item': 'Agenda Item',
      'production_event': 'Production Event',
    };
    return labels[type] || type;
  };

  const getEventColor = (type: string): string => {
    const colors: Record<string, string> = {
      'rehearsal': '#f97316',
      'performance': '#ef4444',
      'audition_slot': '#14b8a6',
      'rehearsal_event': '#f59e0b',
      'agenda_item': '#f59e0b',
      'production_event': '#5a8ff5',
    };
    return colors[type] || '#34d399';
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowOptions(!showOptions)}
        disabled={downloading || events.length === 0}
        variant="primary"
        className="flex items-center gap-2"
        title={events.length === 0 ? 'No events to export' : 'Download calendar as PDF'}
      >
        {downloading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>Download PDF</span>
            {events.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-neu-accent-primary/20 text-current text-sm font-semibold">
                {events.length}
              </span>
            )}
          </>
        )}
      </Button>

      {/* Options Dropdown */}
      {showOptions && !downloading && (
        <div 
          className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-[5px_5px_15px_var(--neu-shadow-dark),-5px_-5px_15px_var(--neu-shadow-light)] border border-neu-border overflow-hidden z-20"
          style={{ backgroundColor: 'var(--neu-surface)' }}
        >
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-neu-text-secondary uppercase">
              Choose Format
            </p>
            
            <button
              onClick={() => handleDownload('grid')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neu-accent-primary/10 transition-colors"
            >
              <Calendar size={18} className="text-neu-accent-primary" />
              <div>
                <div className="text-sm font-medium text-neu-text-primary">Calendar Grid</div>
                <div className="text-xs text-neu-text-secondary">Monthly view with dates</div>
              </div>
            </button>
            
            <button
              onClick={() => handleDownload('list')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neu-accent-primary/10 transition-colors"
            >
              <FileText size={18} className="text-neu-accent-primary" />
              <div>
                <div className="text-sm font-medium text-neu-text-primary">Detailed List</div>
                <div className="text-xs text-neu-text-secondary">Chronological with details</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full right-0 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm z-10 shadow-lg max-w-xs">
          {error}
        </div>
      )}

      {/* Click outside to close */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}
