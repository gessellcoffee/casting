/**
 * Tooltip preferences management - stores dismissed tooltips in profiles.preferences
 */

import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { TooltipId, TooltipPreferences } from '@/types/tooltip';

/**
 * Get user's tooltip preferences
 */
export async function getTooltipPreferences(): Promise<{
  data: TooltipPreferences | null;
  error: Error | null;
}> {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching tooltip preferences:', profileError);
      return { data: null, error: profileError };
    }

    const tooltipPrefs = profile?.preferences?.tooltips as TooltipPreferences;
    
    return { 
      data: tooltipPrefs || { dismissed: [] }, 
      error: null 
    };
  } catch (error) {
    console.error('Error in getTooltipPreferences:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Dismiss a tooltip permanently
 */
export async function dismissTooltip(tooltipId: TooltipId): Promise<{
  data: TooltipPreferences | null;
  error: Error | null;
}> {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Get current preferences
    const { data: currentPrefs } = await getTooltipPreferences();
    const dismissed = currentPrefs?.dismissed || [];

    // Add tooltip to dismissed list if not already there
    if (!dismissed.includes(tooltipId)) {
      dismissed.push(tooltipId);
    }

    const updatedTooltipPrefs: TooltipPreferences = { dismissed };

    // Update preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          tooltips: updatedTooltipPrefs,
        },
      })
      .eq('user_id', user.id)
      .select('preferences')
      .single();

    if (updateError) {
      console.error('Error dismissing tooltip:', updateError);
      return { data: null, error: updateError };
    }

    return { 
      data: profile?.preferences?.tooltips as TooltipPreferences, 
      error: null 
    };
  } catch (error) {
    console.error('Error in dismissTooltip:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reset a dismissed tooltip (allow it to show again)
 */
export async function resetTooltip(tooltipId: TooltipId): Promise<{
  data: TooltipPreferences | null;
  error: Error | null;
}> {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Get current preferences
    const { data: currentPrefs } = await getTooltipPreferences();
    const dismissed = currentPrefs?.dismissed || [];

    // Remove tooltip from dismissed list
    const updatedDismissed = dismissed.filter((id) => id !== tooltipId);

    const updatedTooltipPrefs: TooltipPreferences = { dismissed: updatedDismissed };

    // Update preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          tooltips: updatedTooltipPrefs,
        },
      })
      .eq('id', user.id)
      .select('preferences')
      .single();

    if (updateError) {
      console.error('Error resetting tooltip:', updateError);
      return { data: null, error: updateError };
    }

    return { 
      data: profile?.preferences?.tooltips as TooltipPreferences, 
      error: null 
    };
  } catch (error) {
    console.error('Error in resetTooltip:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reset all dismissed tooltips
 */
export async function resetAllTooltips(): Promise<{
  data: TooltipPreferences | null;
  error: Error | null;
}> {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const updatedTooltipPrefs: TooltipPreferences = { dismissed: [] };

    // Update preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          tooltips: updatedTooltipPrefs,
        },
      })
      .eq('id', user.id)
      .select('preferences')
      .single();

    if (updateError) {
      console.error('Error resetting all tooltips:', updateError);
      return { data: null, error: updateError };
    }

    return { 
      data: profile?.preferences?.tooltips as TooltipPreferences, 
      error: null 
    };
  } catch (error) {
    console.error('Error in resetAllTooltips:', error);
    return { data: null, error: error as Error };
  }
}
