import { useMemo } from 'react';
import { getDateKeyInTimeZone } from '@/lib/utils/dateUtils';

/**
 * Custom hook to group signups by date
 * @param signups - Array of signup objects with audition_slots.start_time
 * @returns Object with date keys and arrays of signups as values
 */
export function useGroupedSignups(signups: any[], timeZone?: string): Record<string, any[]> {
  return useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    signups.forEach((signup) => {
      if (signup.audition_slots?.start_time) {
        const date = new Date(signup.audition_slots.start_time);
        const dateKey = getDateKeyInTimeZone(date, timeZone);
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(signup);
      }
    });
    
    return grouped;
  }, [signups, timeZone]);
}
