'use client';

import { useState } from 'react';
import { createAudition } from '@/lib/supabase/auditions';
import { createAuditionRole, updateAuditionRole, deleteAuditionRole } from '@/lib/supabase/auditionRoles';
import { createAuditionSlots } from '@/lib/supabase/auditionSlots';
import { addProductionTeamMember, inviteProductionTeamMember, sendCalendarToProductionTeam } from '@/lib/supabase/productionTeamMembers';
import { formatUSDate } from '@/lib/utils/dateUtils';

interface ReviewAndSubmitProps {
  castingData: any & {
    roleOperations?: Array<{
      type: 'create' | 'update' | 'delete';
      role?: any;
      roleId?: string;
    }>;
  };
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
        location: castingData.auditionDetails.auditionLocation || null,
        rehearsal_dates: rehearsalDatesStr,
        rehearsal_location: castingData.auditionDetails.rehearsalLocation || null,
        performance_dates: performanceDatesStr,
        performance_location: castingData.auditionDetails.performanceLocation || null,
        ensemble_size: castingData.auditionDetails.ensembleSize,
        equity_status: castingData.auditionDetails.equityStatus,
        is_paid: castingData.auditionDetails.isPaid,
        pay_range: castingData.auditionDetails.payRange || null,
        pay_comments: castingData.auditionDetails.payComments || null,
        workflow_status: castingData.auditionDetails.workflowStatus,
      });

      if (auditionError || !audition) {
        throw new Error('Failed to create audition');
      }

      // Step 2: Process audition role operations
      // All roles are now audition-specific and don't modify the base show
      if (castingData.roleOperations && castingData.roleOperations.length > 0) {
        for (const operation of castingData.roleOperations) {
          switch (operation.type) {
            case 'create':
              if (operation.role) {
                // Ensure the role has the audition_id
                const roleData = {
                  ...operation.role,
                  audition_id: audition.audition_id,
                };
                const { error: createError } = await createAuditionRole(roleData);
                if (createError) {
                  throw new Error(`Failed to create audition role: ${createError.message}`);
                }
              }
              break;

            case 'update':
              if (operation.roleId && operation.role) {
                const { error: updateError } = await updateAuditionRole(operation.roleId, operation.role);
                if (updateError) {
                  throw new Error(`Failed to update audition role: ${updateError.message}`);
                }
              }
              break;

            case 'delete':
              if (operation.roleId) {
                const { error: deleteError } = await deleteAuditionRole(operation.roleId);
                if (deleteError) {
                  throw new Error(`Failed to delete audition role: ${deleteError.message}`);
                }
              }
              break;

            default:
              console.warn('Unknown role operation type:', operation.type);
          }
        }
      } else if (castingData.roles && castingData.roles.length > 0) {
        // Fallback: Create audition roles if no operations provided (backward compatibility)
        for (const role of castingData.roles) {
          const roleData = {
            audition_id: audition.audition_id,
            role_name: role.role_name,
            description: role.description || null,
            role_type: role.role_type,
            gender: role.gender,
            needs_understudy: role.needs_understudy || false,
          };
          const { error: createError } = await createAuditionRole(roleData);
          if (createError) {
            throw new Error(`Failed to create audition role: ${createError.message}`);
          }
        }
      }

      // Step 3: Create audition slots (optional - not required)
      if (castingData.slots && castingData.slots.length > 0) {
        const slotsData = castingData.slots.map((slot: any) => ({
          audition_id: audition.audition_id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          location: slot.location || null,
          max_signups: slot.max_signups,
        }));

        const { error: slotsError } = await createAuditionSlots(slotsData);

        if (slotsError) {
          console.error('Slots creation error:', slotsError);
          // Don't throw - slots are optional, audition was created successfully
          console.warn('Audition created successfully but slots could not be created:', slotsError.message);
        }
      }

      // Step 4: Create production team members
      if (castingData.auditionDetails.productionTeam && castingData.auditionDetails.productionTeam.length > 0) {
        for (const member of castingData.auditionDetails.productionTeam) {
          if (member.userId) {
            // Add existing user to production team
            const { error: teamError } = await addProductionTeamMember(
              audition.audition_id,
              member.userId,
              member.roleTitle,
              userId
            );
            if (teamError) {
              console.error('Failed to add production team member:', teamError);
              // Don't throw - production team is optional
            }
          } else if (member.email) {
            // Invite user by email
            const { error: inviteError } = await inviteProductionTeamMember(
              audition.audition_id,
              member.email,
              member.roleTitle,
              userId
            );
            if (inviteError) {
              console.error('Failed to invite production team member:', inviteError);
              // Don't throw - production team is optional
            }
          }
        }

        // Step 5: Generate and prepare calendar for production team
        const { success: calendarSuccess, error: calendarError } = await sendCalendarToProductionTeam(audition.audition_id);
        if (!calendarSuccess) {
          console.error('Failed to generate calendar for production team:', calendarError);
          // Don't throw - calendar is a nice-to-have feature
        } else {
          console.log('Calendar generated successfully for production team');
        }
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
        <div className="neu-card-raised p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">Hosting</h3>
          <p className="text-neu-text-primary/70">
            {castingData.isCompanyAudition
              ? `Company Audition${castingData.companyId ? '' : ' (No company selected)'}`
              : 'Individual Audition'}
          </p>
        </div>

        {/* Show */}
        <div className="neu-card-raised p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
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
        <div className="neu-card-raised p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
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
        <div className="neu-card-raised p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
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
                      {formatUSDate(date)}
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
                      {formatUSDate(date)}
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
                      {formatUSDate(date)}
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
            <div>
              <span className="text-neu-text-primary/60">Compensation: </span>
              <span className="text-neu-text-primary">
                {castingData.auditionDetails.isPaid ? 'Paid' : 'Not Paid'}
              </span>
            </div>
            {castingData.auditionDetails.isPaid && castingData.auditionDetails.payRange && (
              <div>
                <span className="text-neu-text-primary/60">Pay Range: </span>
                <span className="text-neu-text-primary">
                  {castingData.auditionDetails.payRange}
                </span>
              </div>
            )}
            {castingData.auditionDetails.isPaid && castingData.auditionDetails.payComments && (
              <div>
                <span className="text-neu-text-primary/60">Pay Comments: </span>
                <span className="text-neu-text-primary">
                  {castingData.auditionDetails.payComments}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Audition Slots */}
        <div className="neu-card-raised p-4 rounded-xl bg-neu-surface/50 border border-neu-border">
          <h3 className="text-lg font-medium text-neu-text-primary mb-2">
            Audition Slots ({castingData.slots.length})
          </h3>
          <div className="space-y-2">
            {castingData.slots.length === 0 ? (
              <div className="p-3 rounded-lg bg-neu-surface/50 text-sm text-neu-text-primary/60 italic">
                No audition slots added. You can add them later after creating the production.
              </div>
            ) : (
              castingData.slots.map((slot: any, index: number) => (
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
              ))
            )}
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
          className="n-button-secondary px-6 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-300 font-medium disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="n-button-primary px-6 py-3 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating Audition...' : 'Submit Audition'}
        </button>
      </div>
    </div>
  );
}
