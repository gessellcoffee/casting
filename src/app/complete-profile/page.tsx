'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import Button from '@/components/Button';
import { getUser } from '@/lib/supabase';
import { getProfile, updateProfile } from '@/lib/supabase/profile';
import type { Profile } from '@/lib/supabase/types';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getUser();
        if (!currentUser?.id) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const existingProfile = await getProfile(currentUser.id);
        setProfile(existingProfile);

        if (existingProfile) {
          setFirstName(existingProfile.first_name || '');
          setLastName(existingProfile.last_name || '');

          // If profile already has both names, send them home
          if (existingProfile.first_name && existingProfile.last_name) {
            router.push('/');
            return;
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSave = async () => {
    if (!user?.id) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await updateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      if (updateError) {
        throw updateError;
      }

      router.push('/');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save your name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-md">
          <div className="p-8 text-center text-neu-text-primary/90">Loading profile...</div>
        </StarryContainer>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-md">
          <div className="p-8 space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
                Finish Setting Up Your Profile
              </h1>
              <p className="mt-2 text-neu-text-primary/90 text-sm">
                Please add your first and last name so casting teams and other users know who you are.
              </p>
            </div>

            {error && (
              <div className="mb-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neu-text-primary mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="neu-input"
                  placeholder="John"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neu-text-primary mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="neu-input"
                  placeholder="Doe"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                text={saving ? 'Saving...' : 'Save and Continue'}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </StarryContainer>
      </div>
    </ProtectedRoute>
  );
}
