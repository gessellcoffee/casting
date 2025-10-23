'use client';

import { useState } from 'react';
import { createAudition } from '@/lib/supabase/auditions';
import { createRoles } from '@/lib/supabase/roles';
import { createAuditionSlots } from '@/lib/supabase/auditionSlots';

interface ReviewAndSubmitProps {
  castingData: any;
  userId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ReviewAndSubmit({
  castingData,
  userId,
  onBack,
  onSuccess,
}: ReviewAndSubmitProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create the audition
      // Convert date arrays to formatted strings for storage
      const rehearsalDatesStr = castingData.auditionDetails.rehearsalDates.length > 0
        ? castingData.auditionDetails.rehearsalDates.join(', ')
        : null;
      const performanceDatesStr = castingData.auditionDetails.performanceDates.length > 0
        ? castingData.auditionDetails.performanceDates.join(', ')
        : null;

      const { data: audition, error: auditionError } = await createAudition({
        show_id: castingData.showId,
        user_id: userId,
        company_id: castingData.companyId,
        audition_dates: castingData.auditionDetails.auditionDates,
        audition_location: castingData.auditionDetails.auditionLocation || null,
        rehearsal_dates: rehearsalDatesStr,
        rehearsal_location: castingData.auditionDetails.rehearsalLocation || null,
        performance_dates: performanceDatesStr,
        performance_location: castingData.auditionDetails.performanceLocation || null,
        ensemble_size: castingData.auditionDetails.ensembleSize,
        equity_status: castingData.auditionDetails.equityStatus,
      });

      if (auditionError || !audition) {
        throw new Error('Failed to create audition');
      }

      // Step 2: Create roles
      const rolesData = castingData.roles.map((role: any) => ({
        show_id: castingData.showId,
        role_name: role.role_name,
        description: role.description || null,
        role_type: role.role_type,
        gender: role.gender,
      }));

      const { error: rolesError } = await createRoles(rolesData);

      if (rolesError) {
        throw new Error('Failed to create roles');
      }

      // Step 3: Create audition slots
      const slotsData = castingData.slots.map((slot: any) => ({
        audition_id: audition.audition_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        location: slot.location || null,
        max_signups: slot.max_signups,
      }));

      const { error: slotsError } = await createAuditionSlots(slotsData);

      if (slotsError) {
        throw new Error('Failed to create audition slots');
      }

      // Success!
      onSuccess();
    } catch (err: any) {
      console.error('Error creating audition:', err);
      setError(err.message || 'Failed to create audition. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Review & Submit
        </h2>
        <p className="text-neu-text-primary/70 mb-6">
          Review your audition posting before submitting.
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Company/Individual */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">Hosting</h3>
          <p className="text-neu-text-primary/70">
            {castingData.isCompanyAudition
              ? `Company Audition${castingData.companyId ? '' : ' (No company selected)'}`
              : 'Individual Audition'}
          </p>
        </div>

        {/* Show */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">Show</h3>
          {castingData.showData ? (
            <div>
              <p className="text-neu-text-primary font-medium">{castingData.showData.title}</p>
              {castingData.showData.author && (
                <p className="text-neu-text-primary/60 text-sm">by {castingData.showData.author}</p>
              )}
              {castingData.showData.description && (
                <p className="text-neu-text-primary/50 text-sm mt-1">
                  {castingData.showData.description}
                </p>
              )}
            </div>
          ) : (
            <p className="text-neu-text-primary/70">No show selected</p>
          )}
        </div>

        {/* Roles */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">
            Roles ({castingData.roles.length})
          </h3>
          <div className="space-y-2">
            {castingData.roles.map((role: any, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-neu-surface/50">
                <p className="text-neu-text-primary font-medium">{role.role_name}</p>
                {role.role_type && (
                  <p className="text-neu-text-primary/60 text-sm">{role.role_type}</p>
                )}
                {role.gender && (
                  <p className="text-neu-text-primary/60 text-sm capitalize">{role.gender}</p>
                )}
                {role.description && (
                  <p className="text-neu-text-primary/50 text-sm mt-1">{role.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audition Details */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">Audition Details</h3>
          <div className="space-y-2 text-sm">
            {castingData.auditionDetails.auditionDates.length > 0 && (
              <div>
                <span className="text-neu-text-primary/60">Audition Dates: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {castingData.auditionDetails.auditionDates.map((date: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-text-primary text-xs"
                    >
                      {new Date(date).toLocaleDateString()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {castingData.auditionDetails.rehearsalDates.length > 0 && (
              <div>
                <span className="text-neu-text-primary/60">Rehearsal Dates: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {castingData.auditionDetails.rehearsalDates.map((date: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-text-primary text-xs"
                    >
                      {new Date(date).toLocaleDateString()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {castingData.auditionDetails.rehearsalLocation && (
              <div>
                <span className="text-neu-text-primary/60">Rehearsal Location: </span>
                <span className="text-neu-text-primary">
                  {castingData.auditionDetails.rehearsalLocation}
                </span>
              </div>
            )}
            {castingData.auditionDetails.performanceDates.length > 0 && (
              <div>
                <span className="text-neu-text-primary/60">Performance Dates: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {castingData.auditionDetails.performanceDates.map((date: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded bg-[#5a8ff5]/20 border border-neu-border-focus text-neu-text-primary text-xs"
                    >
                      {new Date(date).toLocaleDateString()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {castingData.auditionDetails.performanceLocation && (
              <div>
                <span className="text-neu-text-primary/60">Performance Location: </span>
                <span className="text-neu-text-primary">
                  {castingData.auditionDetails.performanceLocation}
                </span>
              </div>
            )}
            {castingData.auditionDetails.ensembleSize && (
              <div>
                <span className="text-neu-text-primary/60">Ensemble Size: </span>
                <span className="text-neu-text-primary">
                  {castingData.auditionDetails.ensembleSize}
                </span>
              </div>
            )}
            {castingData.auditionDetails.equityStatus && (
              <div>
                <span className="text-neu-text-primary/60">Equity Status: </span>
                <span className="text-neu-text-primary">
                  {castingData.auditionDetails.equityStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Audition Slots */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">
            Audition Slots ({castingData.slots.length})
          </h3>
          <div className="space-y-2">
            {castingData.slots.map((slot: any, index: number) => (
              <div key={index} className="p-3 rounded-lg bg-neu-surface/50 text-sm">
                <div className="text-neu-text-primary">
                  {new Date(slot.start_time).toLocaleString()} -{' '}
                  {new Date(slot.end_time).toLocaleString()}
                </div>
                {slot.location && (
                  <div className="text-neu-text-primary/60">{slot.location}</div>
                )}
                <div className="text-neu-text-primary/60">
                  Max signups: {slot.max_signups}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-300 font-medium disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating Audition...' : 'Submit Audition'}
        </button>
      </div>
    </div>
  );
}
