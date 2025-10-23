'use client';

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
