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
  const handleNext = () => {
    if (onNext) {
      onNext();
      // Delay scroll to allow DOM to update after state changes
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
      });
    }
  };

  return (
    <div className={`flex justify-between pt-6 ${className}`}>
      {showBack && onBack ? (
        <button
          onClick={onBack}
          disabled={backDisabled}
          className="n-button-secondary px-6 py-3 rounded-xl border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backLabel}
        </button>
      ) : (
        <div></div>
      )}
      {showNext && onNext && (
        <button
          onClick={handleNext}
          disabled={nextDisabled}
          className="n-button-primary px-6 py-3 rounded-xl border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
