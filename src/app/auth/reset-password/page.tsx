'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import StarryContainer from '@/components/StarryContainer';
import { updatePassword } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Handle authentication from URL hash (Supabase PKCE flow)
  useEffect(() => {
    const handleAuthFromHash = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
        } else if (data.session) {
          setIsReady(true);
        } else {
          setError('No active session found. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('An error occurred. Please try again.');
      }
    };

    handleAuthFromHash();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while resetting password';
      
      // Provide clearer message if password is the same as current
      if (errorMessage.toLowerCase().includes('same') || errorMessage.toLowerCase().includes('current')) {
        setError('New password must be different from your current password');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <StarryContainer starCount={15} className="card w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              Set New Password
            </h1>
            <p className="mt-2 text-neu-text-primary/90">
              Enter your new password below
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
              Password updated successfully! Redirecting to login...
            </div>
          )}

          {/* Loading state while verifying session */}
          {!isReady && !error && (
            <div className="text-center text-neu-text-primary/60">
              Verifying reset link...
            </div>
          )}

          {/* Reset Password Form - only show when ready */}
          {isReady && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neu-text-primary mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="neu-input w-full px-4 py-3 pr-12 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary placeholder-neu-text-muted focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neu-text-primary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="neu-input w-full px-4 py-3 pr-12 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary placeholder-neu-text-muted focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className='neu-button'
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          )}
        </div>
      </StarryContainer>
    </div>
  );
}
