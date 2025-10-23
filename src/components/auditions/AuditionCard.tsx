'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/feedback/Badge';

interface AuditionCardProps {
  audition: any;
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  const { show, company, slots, equity_status, audition_location, rehearsal_dates, performance_dates } = audition;

  // Get earliest available slot
  const earliestSlot = slots?.length > 0 
    ? slots.reduce((earliest: any, slot: any) => {
        const slotDate = new Date(slot.start_time);
        return !earliest || slotDate < new Date(earliest.start_time) ? slot : earliest;
      }, null)
    : null;

  // Count available slots (future slots that aren't full)
  const availableSlots = slots?.filter((slot: any) => {
    const slotDate = new Date(slot.start_time);
    const isFuture = slotDate > new Date();
    const isNotFull = (slot.current_signups || 0) < (slot.max_signups || 1);
    return isFuture && isNotFull;
  }).length || 0;

  return (
    <Link href={`/auditions/${audition.audition_id}`}>
      <div className="h-full p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-neu-border/60 shadow-[8px_8px_16px_rgba(163,177,198,0.4),-4px_-4px_12px_rgba(255,255,255,0.5)] hover:shadow-[12px_12px_20px_rgba(163,177,198,0.5),-6px_-6px_16px_rgba(255,255,255,0.6)] hover:transform hover:translate-y-[-2px] transition-all duration-300 cursor-pointer group">
        
        {/* Show Title */}
        <h3 className="text-xl font-bold text-neu-text-primary mb-2 group-hover:text-neu-accent-primary transition-colors">
          {show?.title || 'Untitled Show'}
        </h3>

        {/* Show Author */}
        {show?.author && (
          <p className="text-sm text-neu-text-muted mb-3">
            by {show.author}
          </p>
        )}

        {/* Company */}
        {company && (
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default">
              {company.name}
            </Badge>
          </div>
        )}

        {/* Equity Status */}
        {equity_status && (
          <div className="mb-3">
            <Badge variant="info">
              {equity_status}
            </Badge>
          </div>
        )}

        {/* Audition Location */}
        {audition_location && (
          <div className="mb-3 text-sm text-neu-text-secondary">
            <span className="font-medium text-neu-text-primary">📍 Audition Location:</span> {audition_location}
          </div>
        )}

        {/* Dates */}
        <div className="space-y-2 mb-4 text-sm">
          {rehearsal_dates && (
            <div className="text-neu-text-secondary">
              <span className="font-medium text-neu-text-primary">Rehearsals:</span> {rehearsal_dates}
            </div>
          )}
          {performance_dates && (
            <div className="text-neu-text-secondary">
              <span className="font-medium text-neu-text-primary">Performances:</span> {performance_dates}
            </div>
          )}
        </div>

        {/* Audition Slots Info */}
        <div className="pt-4 border-t border-neu-border">
          {earliestSlot ? (
            <div className="space-y-1">
              <div className="text-sm text-neu-text-primary">
                <span className="font-medium">Next Audition:</span>
              </div>
              <div className="text-sm text-neu-text-secondary">
                {new Date(earliestSlot.start_time).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
              {earliestSlot.location && (
                <div className="text-xs text-neu-text-muted">
                  📍 {earliestSlot.location}
                </div>
              )}
              <div className="text-xs text-neu-accent-primary mt-2">
                {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'} available
              </div>
            </div>
          ) : (
            <div className="text-sm text-neu-text-muted">
              No audition slots scheduled
            </div>
          )}
        </div>

        {/* View Details Button */}
        <div className="mt-4">
          <div className="n-button-primary px-4 py-2 rounded-lg">
            View Details →
          </div>
        </div>
      </div>
    </Link>
  );
}
