'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUser } from '@/lib/supabase';
import { getProfile, updateProfile } from '@/lib/supabase/profile';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load theme from user profile on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const user = await getUser();
        if (user?.id) {
          setUserId(user.id);
          const profile = await getProfile(user.id);
          
          if (profile?.preferences && typeof profile.preferences === 'object') {
            const prefs = profile.preferences as { dark_mode?: boolean };
            const savedTheme = prefs.dark_mode ? 'dark' : 'light';
            setThemeState(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Save to user profile if logged in
    if (userId) {
      try {
        const profile = await getProfile(userId);
        const currentPreferences = (profile?.preferences || {}) as Record<string, any>;
        
        await updateProfile(userId, {
          preferences: {
            ...currentPreferences,
            dark_mode: newTheme === 'dark',
          },
        });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
