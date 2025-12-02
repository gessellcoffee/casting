'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { createAuditionSignup } from '@/lib/supabase/auditionSignups';
import { MdClose } from 'react-icons/md';

interface AuditionSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  auditionId: string;
  auditionTitle: string;
  slotTime: string;
  onSuccess: () => void;
}

export default function AuditionSignupModal({
  isOpen,
  onClose,
  slotId,
  auditionId,
  auditionTitle,
  slotTime,
  onSuccess,
}: AuditionSignupModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Sign up the user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // 2. Sign up for the audition slot
      const { error: auditionSignupError } = await createAuditionSignup({
        slot_id: slotId,
        user_id: authData.user.id,
      });

      if (auditionSignupError) {
        throw auditionSignupError;
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to create account and sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="neu-card-raised rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neu-text-primary mb-2">
              Create Account & Sign Up
            </h2>
            <p className="text-sm text-neu-text-primary/70">
              Create your free account to sign up for this audition
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neu-text-primary/50 hover:text-neu-text-primary transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Audition Info */}
        <div className="neu-card-inset p-4 mb-6 rounded-lg">
          <p className="text-sm font-medium text-neu-text-primary mb-1">
            {auditionTitle}
          </p>
          <p className="text-xs text-neu-text-primary/70">
            {slotTime}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neu-text-primary mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="neu-input w-full"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neu-text-primary mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="neu-input w-full"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="neu-input w-full"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="neu-input w-full"
              placeholder="At least 6 characters"
            />
            <p className="text-xs text-neu-text-primary/60 mt-1">
              Must be at least 6 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="neu-button-group-equal pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] transition-all duration-300 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#6b8dd6] to-[#8b5cf6] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account & Sign Up'}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-4 text-center text-sm text-neu-text-primary/70">
          Already have an account?{' '}
          <button
            onClick={() => {
              onClose();
              window.location.href = '/login';
            }}
            className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors font-medium"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
