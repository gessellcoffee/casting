export type ConflictEventType =
  | 'audition_signup'
  | 'callback'
  | 'personal_event'
  | 'audition_slot'
  | 'rehearsal_event'
  | 'production_event'
  | 'other';

export interface ConflictExportEvent {
  id: string;
  type: ConflictEventType;
  title: string;
  start: Date;
  end: Date;
  location?: string | null;
  sourceLabel?: string;
}

export interface ConflictExportDay {
  dateKey: string;
  events: Array<ConflictExportEvent & { conflictWithIds: string[] }>;
}

function doTimeRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  const s1 = start1.getTime();
  const e1 = end1.getTime();
  const s2 = start2.getTime();
  const e2 = end2.getTime();
  return s1 < e2 && s2 < e1;
}

export function groupEventsByDateKey(
  events: ConflictExportEvent[],
  getDateKey: (d: Date) => string
): Map<string, ConflictExportEvent[]> {
  const map = new Map<string, ConflictExportEvent[]>();
  events.forEach((evt) => {
    const key = getDateKey(evt.start);
    const list = map.get(key) || [];
    list.push(evt);
    map.set(key, list);
  });
  return map;
}

export function buildConflictDays(
  events: ConflictExportEvent[],
  getDateKey: (d: Date) => string
): ConflictExportDay[] {
  const grouped = groupEventsByDateKey(events, getDateKey);
  const days: ConflictExportDay[] = [];

  Array.from(grouped.entries())
    .sort(([a], [b]) => {
      const [ay, am, ad] = a.split('-').map(Number);
      const [by, bm, bd] = b.split('-').map(Number);
      const aDate = new Date(ay, (am || 1) - 1, ad || 1);
      const bDate = new Date(by, (bm || 1) - 1, bd || 1);
      return aDate.getTime() - bDate.getTime();
    })
    .forEach(([dateKey, dayEvents]) => {
      const sorted = [...dayEvents].sort((a, b) => a.start.getTime() - b.start.getTime());

      const conflictWith = new Map<string, Set<string>>();
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          if (doTimeRangesOverlap(sorted[i].start, sorted[i].end, sorted[j].start, sorted[j].end)) {
            if (!conflictWith.has(sorted[i].id)) conflictWith.set(sorted[i].id, new Set());
            if (!conflictWith.has(sorted[j].id)) conflictWith.set(sorted[j].id, new Set());
            conflictWith.get(sorted[i].id)!.add(sorted[j].id);
            conflictWith.get(sorted[j].id)!.add(sorted[i].id);
          }
        }
      }

      const withConflictMeta = sorted.map((e) => ({
        ...e,
        conflictWithIds: Array.from(conflictWith.get(e.id) || []),
      }));

      if (withConflictMeta.length > 0) {
        days.push({ dateKey, events: withConflictMeta });
      }
    });

  return days;
}

function escapeCsvValue(value: string): string {
  if (/[\n",]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildConflictCsv(
  days: ConflictExportDay[],
  opts: {
    includeNames: boolean;
    formatDate: (d: Date) => string;
    formatTime: (d: Date) => string;
  }
): string {
  const lines: string[] = [];
  lines.push(['Date', 'Start', 'End', 'Title', 'Type', 'Conflicts With (count)'].map(escapeCsvValue).join(','));

  days.forEach((day) => {
    day.events.forEach((evt) => {
      const title = opts.includeNames ? evt.title : 'Busy';
      lines.push(
        [
          opts.formatDate(evt.start),
          opts.formatTime(evt.start),
          opts.formatTime(evt.end),
          title,
          evt.type,
          String(evt.conflictWithIds.length),
        ]
          .map((v) => escapeCsvValue(String(v ?? '')))
          .join(',')
      );
    });
  });

  return lines.join('\n');
}

export function buildConflictPlainText(
  days: ConflictExportDay[],
  opts: {
    includeNames: boolean;
    userName: string;
    timeZone: string;
    formatDateHeading: (dateKey: string) => string;
    formatTime: (d: Date) => string;
  }
): string {
  const lines: string[] = [];
  lines.push(`${opts.userName} — Conflicts`);
  lines.push(`Time Zone: ${opts.timeZone}`);
  lines.push('');

  if (days.length === 0) {
    lines.push('No events found for the current filters.');
    return lines.join('\n');
  }

  days.forEach((day) => {
    lines.push(opts.formatDateHeading(day.dateKey));
    day.events
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .forEach((evt) => {
        const start = opts.formatTime(evt.start);
        const end = opts.formatTime(evt.end);
        const hasConflicts = evt.conflictWithIds.length > 0;

        if (!opts.includeNames) {
          lines.push(`- Busy from ${start} to ${end}${hasConflicts ? ' (conflict)' : ''}`);
          return;
        }

        lines.push(`- ${start} - ${end}  ${evt.title}${hasConflicts ? ' (conflict)' : ''}`);
      });
    lines.push('');
  });

  return lines.join('\n');
}
