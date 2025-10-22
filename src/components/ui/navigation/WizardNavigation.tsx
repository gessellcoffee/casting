import React from 'react';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  showBack?: boolean;
  showNext?: boolean;
  className?: string;
}

export default function WizardNavigation({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  backDisabled = false,
  nextDisabled = false,
  showBack = true,
  showNext = true,
  className = '',
}: WizardNavigationProps) {
  return (
    <div className={`flex justify-between pt-6 ${className}`}>
      {showBack && onBack ? (
        <button
          onClick={onBack}
          disabled={backDisabled}
          className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] text-[#b5ccff] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] hover:border-[#5a8ff5]/40 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backLabel}
        </button>
      ) : (
        <div></div>
      )}
      {showNext && onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] text-[#b5ccff] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] hover:border-[#5a8ff5]/40 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
