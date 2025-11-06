'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/feedback/Badge';
import { formatUSDateWithWeekday, formatUSTime } from '@/lib/utils/dateUtils';

interface AuditionCardProps {
  audition: any;
}

export default function AuditionCard({ audition }: AuditionCardProps) {
  const { show, company, slots, equity_status, audition_location, rehearsal_dates, performance_dates, productionTeam } = audition;

  // Format rehearsal dates as a date range
  const formatDateRange = (dates: string | null): string => {
    if (!dates) return '';
    const dateArray = dates.split(',').map(d => d.trim()).filter(Boolean);
    if (dateArray.length === 0) return '';
    if (dateArray.length === 1) return dateArray[0];
    return `${dateArray[0]} - ${dateArray[dateArray.length - 1]}`;
  };

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
      <div className="h-full p-6 rounded-2xl neu-card-raised hover:shadow-neu-raised-lg hover:transform hover:translate-y-[-2px] transition-all duration-300 cursor-pointer group">
        
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

        {/* Compensation */}
        {audition.is_paid !== undefined && (
          <div className="mb-3">
            <Badge variant={audition.is_paid ? "success" : "default"}>
              {audition.is_paid ? '💰 Paid' : '🎭 Non-Paid'}
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
              <span className="font-medium text-neu-text-primary">Rehearsals:</span> {formatDateRange(rehearsal_dates)}
            </div>
          )}
          {performance_dates && (
            <div className="text-neu-text-secondary">
              <span className="font-medium text-neu-text-primary">Performances:</span> {formatDateRange(performance_dates)}
            </div>
          )}
        </div>

        {/* Production Team */}
        {productionTeam && productionTeam.length > 0 && (
          <div className="mb-4 pb-4 border-b border-neu-border">
            <div className="text-xs font-medium text-neu-text-primary mb-2">Production Team</div>
            <div className="flex flex-wrap gap-2">
              {productionTeam.slice(0, 3).map((member: any) => (
                <button
                  key={member.production_team_member_id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/profile/${member.user_id}`;
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neu-surface-dark/30 hover:bg-neu-accent-primary/20 border border-neu-border hover:border-neu-accent-primary/50 transition-all group/member cursor-pointer"
                >
                  {member.profiles?.profile_photo_url ? (
                    <img
                      src={member.profiles.profile_photo_url}
                      alt={member.profiles.email}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-neu-accent-primary/20 flex items-center justify-center">
                      <span className="text-neu-accent-primary font-medium text-[8px]">
                        {member.profiles?.email?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-neu-text-primary group-hover/member:text-neu-accent-primary transition-colors">
                    {member.profiles?.first_name && member.profiles?.last_name
                      ? `${member.profiles.first_name} ${member.profiles.last_name}`
                      : `@${member.profiles?.email}`}
                  </span>
                  <span className="text-[10px] text-neu-text-muted">• {member.role_title}</span>
                </button>
              ))}
              {productionTeam.length > 3 && (
                <div className="flex items-center px-2 py-1 text-xs text-neu-text-muted">
                  +{productionTeam.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audition Slots Info */}
        <div className="pt-4 border-t border-neu-border">
          {earliestSlot ? (
            <div className="space-y-1">
              <div className="text-sm text-neu-text-primary">
                <span className="font-medium">Next Audition:</span>
              </div>
              <div className="text-sm text-neu-text-secondary">
                {formatUSDateWithWeekday(earliestSlot.start_time)}, {formatUSTime(earliestSlot.start_time)}
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
