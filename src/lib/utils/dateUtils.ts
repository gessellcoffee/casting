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
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date in MM/DD/YYYY format
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string in MM/DD/YYYY format
 */
export function formatUSDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date with short month name (e.g., "Jan 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string
 */
export function formatUSDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with full month name (e.g., "January 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string
 */
export function formatUSDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with weekday (e.g., "Mon, Jan 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string with weekday
 */
export function formatUSDateWithWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with full weekday (e.g., "Monday, January 15, 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted date string with full weekday
 */
export function formatUSDateWithFullWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time in US format (e.g., "2:30 PM")
 * @param date - The date/time to format (Date object or date string)
 * @returns The formatted time string
 */
export function formatUSTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(US_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format date and time in US format (e.g., "01/15/2024, 2:30 PM")
 * @param date - The date/time to format (Date object or date string)
 * @returns The formatted date and time string
 */
export function formatUSDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(US_LOCALE, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format date and time with full details (e.g., "Monday, January 15, 2024 at 2:30 PM")
 * @param date - The date/time to format (Date object or date string)
 * @returns The formatted date and time string with full details
 */
export function formatUSDateTimeLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = d.toLocaleDateString(US_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString(US_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Format month and year (e.g., "January 2024")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted month and year string
 */
export function formatUSMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format just the month (short format, e.g., "Jan")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted month string
 */
export function formatUSMonthShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'short',
  });
}

/**
 * Format just month and day (e.g., "Jan 15")
 * @param date - The date to format (Date object or date string)
 * @returns The formatted month and day string
 */
export function formatUSMonthDay(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString(US_LOCALE, {
    month: 'short',
    day: 'numeric',
  });
}
