'use client';

interface AuditionHeaderProps {
  audition: any;
}

export default function AuditionHeader({ audition }: AuditionHeaderProps) {
  const { show, company, equity_status } = audition;

  return (
    <div className="p-8 rounded-xl bg-neu-surface border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)]">
      {/* Show Title */}
      <h1 className="text-4xl font-bold text-neu-text-primary mb-2">
        {show?.title || 'Untitled Show'}
      </h1>

      {/* Author */}
      {show?.author && (
        <p className="text-xl text-neu-text-primary/70 mb-4">
          by {show.author}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {company && (
          <span className="px-3 py-1 rounded-lg bg-neu-surface/80 border border-neu-border-focus text-neu-text-primary text-sm shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
            {company.name}
          </span>
        )}
        {equity_status && (
          <span className="px-3 py-1 rounded-lg bg-neu-surface/80 border border-neu-border text-neu-accent-secondary text-sm shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
            {equity_status}
          </span>
        )}
      </div>

      {/* Description */}
      {show?.description && (
        <p className="text-neu-text-primary/70 leading-relaxed">
          {show.description}
        </p>
      )}
    </div>
  );
}
