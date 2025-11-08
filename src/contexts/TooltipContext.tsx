'use client';

/**
 * TooltipContext - Manages tooltip dismissal state globally
 * Follows the same pattern as ThemeContext
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TooltipId, TooltipPreferences } from '@/types/tooltip';
import {
  getTooltipPreferences,
  dismissTooltip as dismissTooltipDb,
  resetTooltip as resetTooltipDb,
  resetAllTooltips as resetAllTooltipsDb,
} from '@/lib/supabase/tooltipPreferences';

interface TooltipContextType {
  dismissedTooltips: TooltipId[];
  isTooltipDismissed: (tooltipId: TooltipId) => boolean;
  dismissTooltip: (tooltipId: TooltipId) => Promise<void>;
  hideTooltipTemporarily: (tooltipId: TooltipId) => void;
  resetTooltip: (tooltipId: TooltipId) => Promise<void>;
  resetAllTooltips: () => Promise<void>;
  loading: boolean;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [dismissedTooltips, setDismissedTooltips] = useState<TooltipId[]>([]);
  const [temporarilyHidden, setTemporarilyHidden] = useState<TooltipId[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dismissed tooltips on mount
  useEffect(() => {
    loadTooltipPreferences();
  }, []);

  async function loadTooltipPreferences() {
    try {
      const { data, error } = await getTooltipPreferences();
      if (!error && data) {
        setDismissedTooltips(data.dismissed || []);
      }
    } catch (error) {
      console.error('Error loading tooltip preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  const isTooltipDismissed = (tooltipId: TooltipId): boolean => {
    return dismissedTooltips.includes(tooltipId) || temporarilyHidden.includes(tooltipId);
  };

  const dismissTooltip = async (tooltipId: TooltipId): Promise<void> => {
    try {
      const { data, error } = await dismissTooltipDb(tooltipId);
      if (!error && data) {
        setDismissedTooltips(data.dismissed || []);
      }
    } catch (error) {
      console.error('Error dismissing tooltip:', error);
    }
  };

  const hideTooltipTemporarily = (tooltipId: TooltipId): void => {
    setTemporarilyHidden((prev) => {
      if (!prev.includes(tooltipId)) {
        return [...prev, tooltipId];
      }
      return prev;
    });
  };

  const resetTooltip = async (tooltipId: TooltipId): Promise<void> => {
    try {
      const { data, error } = await resetTooltipDb(tooltipId);
      if (!error && data) {
        setDismissedTooltips(data.dismissed || []);
        // Also remove from temporarily hidden
        setTemporarilyHidden((prev) => prev.filter((id) => id !== tooltipId));
      }
    } catch (error) {
      console.error('Error resetting tooltip:', error);
    }
  };

  const resetAllTooltips = async (): Promise<void> => {
    try {
      const { data, error } = await resetAllTooltipsDb();
      if (!error && data) {
        setDismissedTooltips(data.dismissed || []);
        setTemporarilyHidden([]);
      }
    } catch (error) {
      console.error('Error resetting all tooltips:', error);
    }
  };

  return (
    <TooltipContext.Provider
      value={{
        dismissedTooltips,
        isTooltipDismissed,
        dismissTooltip,
        hideTooltipTemporarily,
        resetTooltip,
        resetAllTooltips,
        loading,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltip(): TooltipContextType {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
}
