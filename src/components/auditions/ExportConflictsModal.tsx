'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';
import type { CalendarEvent } from '@/lib/supabase/types';
import {
  dateInputValueToUtcIso,
  formatUSDateLong,
  formatUSTime,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
} from '@/lib/utils/dateUtils';
import type { EventTypeFilter } from './CalendarLegend';
import {
  type ConflictExportEvent,
  buildConflictCsv,
  buildConflictDays,
  buildConflictPlainText,
} from '@/lib/utils/calendarConflictExport';

interface ExportConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  timeZone: string;
  signups: any[];
  callbacks: any[];
  personalEvents: CalendarEvent[];
  productionEvents: ProductionDateEvent[];
  filters: EventTypeFilter | null;
  showCallbacks: boolean;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDateInputValueFromDate(date: Date, timeZone?: string): string {
  const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysToDateInput(value: string, days: number): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function printHtmlDocument(html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  // Using srcdoc avoids popup blockers and is generally reliable.
  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  const cleanup = () => {
    iframe.remove();
  };

  iframe.onload = () => {
    const w = iframe.contentWindow;
    if (!w) {
      cleanup();
      return;
    }

    const afterPrint = () => {
      w.removeEventListener('afterprint', afterPrint);
      cleanup();
    };

    w.addEventListener('afterprint', afterPrint);

    // Give the browser a tick to finish layout.
    setTimeout(() => {
      w.focus();
      w.print();
    }, 50);

    // Fallback cleanup (some browsers don't fire afterprint reliably).
    setTimeout(() => {
      cleanup();
    }, 30_000);
  };
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportConflictsModal({
  isOpen,
  onClose,
  userName,
  timeZone,
  signups,
  callbacks,
  personalEvents,
  productionEvents,
  filters,
  showCallbacks,
}: ExportConflictsModalProps) {
  const [includeNames, setIncludeNames] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  const normalizedEvents = useMemo<ConflictExportEvent[]>(() => {
    const events: ConflictExportEvent[] = [];

    const includeSignups = filters?.auditionSignups !== false;
    const includeCallbacks = filters?.callbacks !== false && showCallbacks;
    const includePersonal = filters?.personalEvents !== false;

    if (includeSignups) {
      (signups || []).forEach((s: any) => {
        const slot = s?.audition_slots;
        if (!slot?.start_time || !slot?.end_time) return;

        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        const showTitle = slot?.auditions?.shows?.title || 'Audition';
        const title = `${showTitle} - Audition`;
        events.push({
          id: `audition-signup-${s.signup_id || `${start.getTime()}-${Math.random()}`}`,
          type: 'audition_signup',
          title,
          start,
          end,
          location: slot.location || slot?.auditions?.audition_location || null,
        });
      });
    }

    if (includeCallbacks) {
      (callbacks || []).forEach((c: any) => {
        const slot = c?.callback_slots;
        if (!slot?.start_time || !slot?.end_time) return;

        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        const showTitle = slot?.auditions?.shows?.title || 'Callback';
        const title = `${showTitle} - Callback`;
        events.push({
          id: `callback-${c.invitation_id || `${start.getTime()}-${Math.random()}`}`,
          type: 'callback',
          title,
          start,
          end,
          location: slot.location || null,
        });
      });
    }

    if (includePersonal) {
      (personalEvents || []).forEach((e: any) => {
        const startRaw = e.start_time || e.start;
        const endRaw = e.end_time || e.end;
        if (!startRaw) return;

        const isAllDay = !!(e.all_day ?? e.allDay);

        const start = new Date(startRaw);
        let end = endRaw ? new Date(endRaw) : new Date(start);

        if (isAllDay) {
          const dayStart = startOfDay(start);
          const dayEnd = endOfDay(start);

          // Some sources store all-day as midnight-to-midnight or omit end.
          // Normalize to same-day end-of-day so the export always shows a time range.
          end = dayEnd;
          events.push({
            id: `personal-${e.id || `${dayStart.getTime()}-${Math.random()}`}`,
            type: 'personal_event',
            title: e.title || 'Personal Event',
            start: dayStart,
            end,
            location: e.location || null,
          });
          return;
        }

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
        if (end.getTime() <= start.getTime()) {
          end = new Date(start.getTime() + 60 * 60 * 1000);
        }

        const title = e.title || 'Personal Event';
        events.push({
          id: `personal-${e.id || `${start.getTime()}-${Math.random()}`}`,
          type: 'personal_event',
          title,
          start,
          end,
          location: e.location || null,
        });
      });
    }

    (productionEvents || []).forEach((e: any) => {
      const start = (e.startTime ? new Date(e.startTime) : new Date(e.date)) as Date;
      let end: Date;

      if (e.endTime) {
        end = new Date(e.endTime);
      } else if (e.startTime) {
        end = new Date(start.getTime() + 60 * 60 * 1000);
      } else {
        end = endOfDay(start);
      }

      const id =
        e.productionEventId ||
        e.eventId ||
        e.slotId ||
        `${e.type}-${start.getTime()}-${e.title}`;

      let type: ConflictExportEvent['type'] = 'other';
      if (e.type === 'audition_slot') type = 'audition_slot';
      if (e.type === 'rehearsal_event') type = 'rehearsal_event';
      if (e.type === 'production_event') type = 'production_event';

      events.push({
        id: `prod-${id}`,
        type,
        title: e.title || 'Production Event',
        start,
        end,
        location: e.location || null,
      });
    });

    return events
      .filter((e) => !Number.isNaN(e.start.getTime()) && !Number.isNaN(e.end.getTime()))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [signups, callbacks, personalEvents, productionEvents, filters, showCallbacks]);

  useEffect(() => {
    if (normalizedEvents.length === 0) {
      setRangeStart('');
      setRangeEnd('');
      return;
    }

    const minStart = normalizedEvents.reduce(
      (min, e) => (e.start.getTime() < min.getTime() ? e.start : min),
      normalizedEvents[0].start
    );
    const maxEnd = normalizedEvents.reduce(
      (max, e) => (e.end.getTime() > max.getTime() ? e.end : max),
      normalizedEvents[0].end
    );

    const nextStart = formatDateInputValueFromDate(minStart, timeZone);
    const nextEnd = formatDateInputValueFromDate(maxEnd, timeZone);

    setRangeStart((prev) => {
      if (!prev) return nextStart;
      if (prev < nextStart || prev > nextEnd) return nextStart;
      return prev;
    });
    setRangeEnd((prev) => {
      if (!prev) return nextEnd;
      if (prev > nextEnd || prev < nextStart) return nextEnd;
      return prev;
    });
  }, [normalizedEvents, timeZone]);

  const normalizedEventsInRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return normalizedEvents;

    const startUtcIso = dateInputValueToUtcIso(rangeStart, timeZone);
    const endExclusiveUtcIso = dateInputValueToUtcIso(addDaysToDateInput(rangeEnd, 1), timeZone);
    const start = new Date(startUtcIso);
    const endInclusive = new Date(new Date(endExclusiveUtcIso).getTime() - 1);

    return normalizedEvents.filter((e) => e.start.getTime() <= endInclusive.getTime() && e.end.getTime() >= start.getTime());
  }, [normalizedEvents, rangeStart, rangeEnd, timeZone]);

  const conflictDays = useMemo(() => {
    return buildConflictDays(normalizedEventsInRange, (d) => getDateKeyInTimeZone(d, timeZone));
  }, [normalizedEventsInRange, timeZone]);

  const plainText = useMemo(() => {
    return buildConflictPlainText(conflictDays, {
      includeNames,
      userName: userName || 'User',
      timeZone,
      formatDateHeading: (dateKey) => {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        return formatUSDateLong(dt, timeZone);
      },
      formatTime: (d) => formatUSTime(d, timeZone),
    });
  }, [conflictDays, includeNames, timeZone, userName]);

  if (!isOpen) return null;

  const totalEvents = conflictDays.reduce((sum, day) => sum + day.events.length, 0);

  return (
    <div className="neu-modal-overlay" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="neu-modal neu-modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-neu-text-primary">
              {userName || 'User'} — Conflicts
            </h2>
            <p className="text-sm text-neu-text-primary/70 mt-1">
              {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-neu-text-primary/70">Time Zone</div>
            <div className="text-sm font-medium text-neu-text-primary">{timeZone}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neu-text-primary/70">Start date</label>
            <input
              type="date"
              className="neu-input"
              value={rangeStart}
              onChange={(e) => {
                const next = e.target.value;
                setRangeStart(next);
                if (rangeEnd && next && next > rangeEnd) {
                  setRangeEnd(next);
                }
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neu-text-primary/70">End date</label>
            <input
              type="date"
              className="neu-input"
              value={rangeEnd}
              onChange={(e) => {
                const next = e.target.value;
                setRangeEnd(next);
                if (rangeStart && next && next < rangeStart) {
                  setRangeStart(next);
                }
              }}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNames}
              onChange={(e) => setIncludeNames(e.target.checked)}
              className="w-4 h-4 rounded border-neu-border bg-neu-surface/50 text-[#9b87f5] focus:ring-[#9b87f5] focus:ring-offset-0 shadow-[inset_2px_2px_5px_var(--neu-shadow-dark)]"
            />
            <span className="text-sm text-neu-text-primary font-medium">Include event names</span>
          </label>

          <div className="flex flex-wrap items-center gap-2 justify-end md:col-span-3">
            <button
              className="n-button-secondary"
              disabled={busy}
              onClick={async () => {
                try {
                  setBusy(true);
                  await navigator.clipboard.writeText(plainText);
                } finally {
                  setBusy(false);
                }
              }}
              type="button"
            >
              Copy
            </button>

            <button
              className="n-button-secondary"
              disabled={busy}
              onClick={() => {
                const csv = buildConflictCsv(conflictDays, {
                  includeNames,
                  formatDate: (d) => formatUSDateLong(d, timeZone),
                  formatTime: (d) => formatUSTime(d, timeZone),
                });
                downloadTextFile('calendar-conflicts.csv', csv, 'text/csv;charset=utf-8');
              }}
              type="button"
            >
              Download CSV
            </button>

            <button
              className="n-button-primary"
              disabled={busy}
              onClick={() => {
                const rangeLabel = rangeStart && rangeEnd ? `${rangeStart} to ${rangeEnd}` : '';
                const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Calendar Conflicts</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px; color:#111;}
  .header{display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px;}
  .title{font-size:20px; font-weight:700; margin:0;}
  .tz{font-size:12px; text-align:right;}
  .range{font-size:12px; margin-top:6px;}
  .date{margin-top:18px; font-size:14px; font-weight:700;}
  table{width:100%; border-collapse:collapse; margin-top:8px;}
  th,td{border:1px solid #ddd; padding:8px; font-size:12px;}
  th{text-align:left; background:#f6f6f6;}
</style>
</head><body>
<div class="header"><div><h1 class="title">${(userName || 'User').replace(/</g,'&lt;')} — Conflicts</h1>${rangeLabel ? `<div class="range">Range: ${rangeLabel}</div>` : ''}</div><div class="tz"><div>Time Zone</div><div><strong>${timeZone.replace(/</g,'&lt;')}</strong></div></div></div>
${conflictDays.length === 0 ? '<p>No conflicts found for the current filters.</p>' : conflictDays.map(day=>{
  const [y,m,d] = day.dateKey.split('-').map(Number);
  const dateLabel = formatUSDateLong(new Date(y,(m||1)-1,d||1), timeZone);
  const rows = day.events.sort((a,b)=>a.start.getTime()-b.start.getTime()).map(evt=>{
    const title = includeNames ? evt.title : 'Busy';
    const start = formatUSTime(evt.start, timeZone);
    const end = formatUSTime(evt.end, timeZone);
    return `<tr><td>${start}</td><td>${end}</td><td>${title.replace(/</g,'&lt;')}</td><td>${evt.conflictWithIds.length}</td></tr>`;
  }).join('');
  return `<div class="date">${dateLabel}</div><table><thead><tr><th>Start</th><th>End</th><th>Event</th><th># Conflicts</th></tr></thead><tbody>${rows}</tbody></table>`;
}).join('')}
</body></html>`;

                printHtmlDocument(html);
              }}
              type="button"
            >
              Print
            </button>

            <button className="n-button-secondary" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-neu-border bg-neu-surface/40 p-3 max-h-[60vh] overflow-auto">
          <pre className="whitespace-pre-wrap text-xs sm:text-sm text-neu-text-primary">{plainText}</pre>
        </div>
      </div>
    </div>
  );
}
