'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { getUser } from '@/lib/supabase';
import { getProfile } from '@/lib/supabase/profile';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Moon, Sun, User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, isLoading: themeLoading } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser();
        setUser(userData);

        if (userData?.id) {
          const profileData = await getProfile(userData.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || themeLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="neu-text-secondary">Loading settings...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold neu-text-primary mb-2">Settings</h1>
          <p className="neu-text-secondary">Manage your account preferences and settings</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="neu-icon-btn">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold neu-text-primary">Appearance</h2>
                <p className="text-sm neu-text-muted">Customize how the app looks</p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-neu-border hover:border-neu-border-focus transition-colors">
                <div className="flex items-center gap-4">
                  <div className="neu-icon-btn">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium neu-text-primary">Dark Mode</h3>
                    <p className="text-sm neu-text-muted">
                      {theme === 'dark' 
                        ? 'Deep navy cosmic theme with starfield effects' 
                        : 'Light neumorphic theme with soft gradients'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm neu-text-secondary font-medium">
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-purple-600' 
                        : 'bg-gray-300'
                    }`}
                    aria-label="Toggle dark mode"
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="neu-icon-btn">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold neu-text-primary">Account</h2>
                <p className="text-sm neu-text-muted">Manage your account information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-neu-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium neu-text-primary">Profile</h3>
                    <p className="text-sm neu-text-muted">
                      {profile?.first_name || profile?.email || user?.email || 'Not set'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="n-button-primary text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="neu-icon-btn">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold neu-text-primary">Notifications</h2>
                <p className="text-sm neu-text-muted">Configure notification preferences</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neu-border">
              <p className="text-sm neu-text-muted">
                Notification preferences coming soon
              </p>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="neu-icon-btn">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold neu-text-primary">Privacy & Security</h2>
                <p className="text-sm neu-text-muted">Manage your privacy settings</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neu-border">
              <p className="text-sm neu-text-muted">
                Privacy settings coming soon
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.back()}
            className="n-button-secondary"
          >
            Back
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
