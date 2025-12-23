/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today, false otherwise
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 * @param date - The date to check
 * @returns True if the date is in the past, false otherwise
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if a date is in the future
 * @param date - The date to check
 * @returns True if the date is in the future, false otherwise
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function getEffectiveTimeZone(timeZonePreference?: string | null): string {
  const fallback = getBrowserTimeZone();
  const tz = timeZonePreference || fallback;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return fallback;
  }
}

/**
 * Format a date as a relative time string (e.g., "2h ago", "3d ago")
 * @param dateString - The date string to format
 * @returns The formatted relative time string
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatUSDate(date);
}

/**
 * US date/time formatting options
 * All dates will use MM/DD/YYYY format and CST timezone where applicable
 */
const US_LOCALE = 'en-US';
const US_TIMEZONE = 'America/Chicago'; // CST/CDT

/**
 * Parse YYYY-MM-DD string as local date to avoid timezone issues
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
function parseLocalDate(dateString: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date in MM/DD/YYYY format
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string in MM/DD/YYYY format
 */
export function formatUSDate(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format a date with short month name (e.g., "Jan 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string
 */
export function formatUSDateShort(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format a date with full month name (e.g., "January 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string
 */
export function formatUSDateLong(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format a date with weekday (e.g., "Mon, Jan 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string with weekday
 */
export function formatUSDateWithWeekday(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format a date with full weekday (e.g., "Monday, January 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string with full weekday
 */
export function formatUSDateWithFullWeekday(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format time in US format (e.g., "2:30 PM")
 * @param date - The date/time to format (Date object, date string, or time string HH:MM:SS)
 * @returns The formatted time string
 */
export function formatUSTime(date: Date | string, timeZone?: string): string {
  let d: Date;
  
  if (typeof date === 'string') {
    // Check if it's a time-only string (HH:MM or HH:MM:SS)
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(date)) {
      // Create a date object with today's date and the specified time
      const [hours, minutes] = date.split(':').map(Number);
      d = new Date();
      d.setHours(hours, minutes, 0, 0);
    } else {
      // It's a full date string
      d = new Date(date);
    }
  } else {
    d = date;
  }
  
  return d.toLocaleTimeString(US_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * Format date and time in US format (e.g., "01/15/2024, 2:30 PM")
 * @param date - The date/time to format (Date object or date string)
 * @returns The formatted date and time string
 */
export function formatUSDateTime(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(US_LOCALE, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * Format date and time with full details (e.g., "Monday, January 15, 2024 at 2:30 PM")
 * @param date - The date/time to format (Date object or date string)
 * @returns The formatted date and time string with full details
 */
export function formatUSDateTimeLong(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = d.toLocaleDateString(US_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  });
  const timePart = d.toLocaleTimeString(US_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Format month and year (e.g., "January 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted month and year string
 */
export function formatUSMonthYear(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format just the month (short format, e.g., "Jan")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted month string
 */
export function formatUSMonthShort(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'short',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

/**
 * Format just month and day (e.g., "Jan 15")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted month and day string
 */
export function formatUSMonthDay(date: Date | string, timeZone?: string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: typeof date === 'string' ? undefined : timeZone,
  });
}

export function getDatePartsInTimeZone(date: Date, timeZone?: string): { year: number; month: number; day: number } {
  const tz = getEffectiveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);

  return { year, month, day };
}

export function getDateKeyInTimeZone(date: Date, timeZone?: string): string {
  const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
  return `${year}-${month}-${day}`;
}

export function formatDateInputValueFromUtc(utcIso: string, timeZone?: string): string {
  const d = new Date(utcIso);
  const { year, month, day } = getDatePartsInTimeZone(d, timeZone);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatDateTimeLocalInputValueFromUtc(utcIso: string, timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);
  const d = new Date(utcIso);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const year = parts.find(p => p.type === 'year')?.value || '0000';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function getZonedOffsetMs(date: Date, timeZone: string): number {
  const utcString = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzString = date.toLocaleString('en-US', { timeZone });
  const utcDate = new Date(utcString);
  const tzDate = new Date(tzString);
  return tzDate.getTime() - utcDate.getTime();
}

export function dateTimeLocalInputValueToUtcIso(value: string, timeZone?: string): string {
  const tz = getEffectiveTimeZone(timeZone);

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    const d = new Date(value);
    return d.toISOString();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  let offset = getZonedOffsetMs(utcGuess, tz);
  let adjusted = new Date(utcGuess.getTime() - offset);
  const offset2 = getZonedOffsetMs(adjusted, tz);
  if (offset2 !== offset) {
    adjusted = new Date(utcGuess.getTime() - offset2);
  }

  return adjusted.toISOString();
}

export function dateInputValueToUtcIso(value: string, timeZone?: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const d = new Date(value);
    return d.toISOString();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const tz = getEffectiveTimeZone(timeZone);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  let offset = getZonedOffsetMs(utcGuess, tz);
  let adjusted = new Date(utcGuess.getTime() - offset);
  const offset2 = getZonedOffsetMs(adjusted, tz);
  if (offset2 !== offset) {
    adjusted = new Date(utcGuess.getTime() - offset2);
  }

  return adjusted.toISOString();
}
