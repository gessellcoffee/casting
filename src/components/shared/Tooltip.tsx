'use client';

/**
 * Reusable Tooltip component with dismissal options
 * Follows neumorphic design patterns from the application
 */

import React, { useEffect, useState } from 'react';
import { useTooltip } from '@/contexts/TooltipContext';
import { TooltipId } from '@/types/tooltip';
import styles from './Tooltip.module.css';

interface TooltipProps {
  id: TooltipId;
  title?: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  showOnMount?: boolean;
  delay?: number;
}

export default function Tooltip({
  id,
  title,
  message,
  position = 'top',
  children,
  showOnMount = true,
  delay = 1000,
}: TooltipProps) {
  const { isTooltipDismissed, dismissTooltip, hideTooltipTemporarily } = useTooltip();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isTooltipDismissed(id) && showOnMount) {
      // Show tooltip after delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [id, isTooltipDismissed, showOnMount, delay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      hideTooltipTemporarily(id);
    }, 300); // Match animation duration
  };

  const handleDismissForever = async () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
    await dismissTooltip(id);
  };

  if (!isVisible || isTooltipDismissed(id)) {
    return <>{children}</>;
  }

  return (
    <div className={styles.tooltipWrapper}>
      {children}
      <div
        className={`${styles.tooltipContainer} ${styles[position]} ${
          isAnimating ? styles.visible : ''
        }`}
        role="tooltip"
        aria-live="polite"
      >
        <div className={styles.tooltipContent}>
          {title && <div className={styles.tooltipTitle}>{title}</div>}
          <div className={styles.tooltipMessage}>{message}</div>
          
          <div className={styles.tooltipActions}>
            <button
              onClick={handleClose}
              className={styles.closeButton}
              aria-label="Close tooltip"
            >
              Close
            </button>
            <button
              onClick={handleDismissForever}
              className={styles.dismissButton}
              aria-label="Don't show again"
            >
              Don&apos;t show again
            </button>
          </div>
        </div>
        <div className={styles.tooltipArrow}></div>
      </div>
    </div>
  );
}
