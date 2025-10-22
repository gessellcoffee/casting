'use client';

interface AuditionHeaderProps {
  audition: any;
}

export default function AuditionHeader({ audition }: AuditionHeaderProps) {
  const { show, company, equity_status } = audition;

  return (
    <div className="p-8 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
      {/* Show Title */}
      <h1 className="text-4xl font-bold text-[#c5ddff] mb-2">
        {show?.title || 'Untitled Show'}
      </h1>

      {/* Author */}
      {show?.author && (
        <p className="text-xl text-[#c5ddff]/70 mb-4">
          by {show.author}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {company && (
          <span className="px-3 py-1 rounded-lg bg-[#2e3e5e]/80 border border-[#5a8ff5]/30 text-[#c5ddff] text-sm shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            {company.name}
          </span>
        )}
        {equity_status && (
          <span className="px-3 py-1 rounded-lg bg-[#2e3e5e]/80 border border-[#4a7bd9]/30 text-[#94b0f6] text-sm shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
            {equity_status}
          </span>
        )}
      </div>

      {/* Description */}
      {show?.description && (
        <p className="text-[#c5ddff]/70 leading-relaxed">
          {show.description}
        </p>
      )}
    </div>
  );
}
