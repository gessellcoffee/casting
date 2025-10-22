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
      <div className="h-full p-6 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)] hover:border-[#5a8ff5]/40 transition-all duration-300 cursor-pointer group">
        
        {/* Show Title */}
        <h3 className="text-xl font-bold text-[#c5ddff] mb-2 group-hover:text-[#5a8ff5] transition-colors">
          {show?.title || 'Untitled Show'}
        </h3>

        {/* Show Author */}
        {show?.author && (
          <p className="text-sm text-[#c5ddff]/60 mb-3">
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
          <div className="mb-3 text-sm text-[#c5ddff]/70">
            <span className="font-medium text-[#c5ddff]">📍 Audition Location:</span> {audition_location}
          </div>
        )}

        {/* Dates */}
        <div className="space-y-2 mb-4 text-sm">
          {rehearsal_dates && (
            <div className="text-[#c5ddff]/70">
              <span className="font-medium text-[#c5ddff]">Rehearsals:</span> {rehearsal_dates}
            </div>
          )}
          {performance_dates && (
            <div className="text-[#c5ddff]/70">
              <span className="font-medium text-[#c5ddff]">Performances:</span> {performance_dates}
            </div>
          )}
        </div>

        {/* Audition Slots Info */}
        <div className="pt-4 border-t border-[#4a7bd9]/20">
          {earliestSlot ? (
            <div className="space-y-1">
              <div className="text-sm text-[#c5ddff]">
                <span className="font-medium">Next Audition:</span>
              </div>
              <div className="text-sm text-[#c5ddff]/70">
                {new Date(earliestSlot.start_time).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
              {earliestSlot.location && (
                <div className="text-xs text-[#c5ddff]/60">
                  📍 {earliestSlot.location}
                </div>
              )}
              <div className="text-xs text-[#5a8ff5] mt-2">
                {availableSlots} {availableSlots === 1 ? 'slot' : 'slots'} available
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#c5ddff]/50">
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
