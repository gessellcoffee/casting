'use client';

import { useState, useEffect } from 'react';
import { getProductionTeamMembers } from '@/lib/supabase/productionTeamMembers';
import type { ProductionTeamMemberWithProfile } from '@/lib/supabase/types';

interface AuditionInfoProps {
  audition: any;
}

export default function AuditionInfo({ audition }: AuditionInfoProps) {
  const {
    audition_dates,
    audition_location,
    rehearsal_dates,
    rehearsal_location,
    performance_dates,
    performance_location,
    ensemble_size,
    equity_status,
  } = audition;

  const [productionTeam, setProductionTeam] = useState<ProductionTeamMemberWithProfile[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    const loadProductionTeam = async () => {
      if (audition.audition_id) {
        setLoadingTeam(true);
        const members = await getProductionTeamMembers(audition.audition_id);
        // Filter to only show active (confirmed) members
        const activeMembers = members.filter(member => member.status === 'active');
        setProductionTeam(activeMembers);
        setLoadingTeam(false);
      }
    };

    loadProductionTeam();
  }, [audition.audition_id]);

  return (
    <div className="p-6 rounded-xl bg-neu-surface/50 border border-neu-border sticky top-8">
      <h2 className="text-xl font-semibold text-neu-text-primary mb-4">
        Production Details
      </h2>

      <div className="space-y-4">
        {/* Audition Info */}
        {(audition_dates || audition_location) && (
          <div>
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              Auditions
            </h3>
            {audition_dates && Array.isArray(audition_dates) && audition_dates.length > 0 && (
              <div className="text-sm text-neu-text-primary/70 mb-1">
                📅 {audition_dates.map(date => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }).join(', ')}
              </div>
            )}
            {audition_location && (
              <div className="text-sm text-neu-text-primary/70">
                📍 {audition_location}
              </div>
            )}
          </div>
        )}

        {/* Equity Status */}
        {equity_status && (
          <div>
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              Equity Status
            </h3>
            <div className="text-sm text-neu-text-primary/70">
              {equity_status}
            </div>
          </div>
        )}
        {/* Rehearsal Info */}
        {(rehearsal_dates || rehearsal_location) && (
          <div>
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              Rehearsals
            </h3>
            {rehearsal_dates && (
              <div className="text-sm text-neu-text-primary/70 mb-1">
                📅 {rehearsal_dates}
              </div>
            )}
            {rehearsal_location && (
              <div className="text-sm text-neu-text-primary/70">
                📍 {rehearsal_location}
              </div>
            )}
          </div>
        )}

        {/* Performance Info */}
        {(performance_dates || performance_location) && (
          <div>
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              Performances
            </h3>
            {performance_dates && (
              <div className="text-sm text-neu-text-primary/70 mb-1">
                📅 {performance_dates}
              </div>
            )}
            {performance_location && (
              <div className="text-sm text-neu-text-primary/70">
                📍 {performance_location}
              </div>
            )}
          </div>
        )}

        {/* Ensemble Size */}
        {ensemble_size && (
          <div>
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              Ensemble
            </h3>
            <div className="text-sm text-neu-text-primary/70">
              {ensemble_size} performers
            </div>
          </div>
        )}

        {/* Production Team */}
        {!loadingTeam && productionTeam.length > 0 && (
          <div className="pt-4 border-t border-neu-border">
            <h3 className="text-sm font-medium text-neu-text-primary mb-3">
              Production Team
            </h3>
            <div className="space-y-2">
              {productionTeam.map((member) => (
                <div 
                  key={member.production_team_member_id}
                  className="flex items-center gap-2 text-sm"
                >
                  {member.profiles ? (
                    <>
                      {member.profiles.profile_photo_url ? (
                        <img
                          src={member.profiles.profile_photo_url}
                          alt={member.profiles.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-neu-accent-primary/20 flex items-center justify-center">
                          <span className="text-neu-accent-primary font-medium text-xs">
                            {member.profiles.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-neu-text-primary font-medium">
                          {member.profiles.first_name && member.profiles.last_name
                            ? `${member.profiles.first_name} ${member.profiles.last_name}`
                            : `@${member.profiles.username}`}
                        </div>
                        <div className="text-neu-text-primary/60 text-xs">
                          {member.role_title}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1">
                      <div className="text-neu-text-primary font-medium">
                        {member.role_title}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {audition.user && (
          <div className="pt-4 border-t border-neu-border">
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              Posted By
            </h3>
            <div className="text-sm text-neu-text-primary/70">
              {audition.user.email}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
