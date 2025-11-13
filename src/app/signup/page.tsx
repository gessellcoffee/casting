'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail } from 'lucide-react';
import StarryContainer from '@/components/StarryContainer';
import { supabase } from '@/lib/supabase/client';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-fill email from query parameter
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setMessage('Account created successfully! Check your email for the confirmation link.');
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google sign-up');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <StarryContainer starCount={15} className="card w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-4">
              <Mail className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              Join Belong Here Theater
            </h1>
            {email && (
              <p className="mt-2 text-neu-text-primary/90">
                You've been invited! Create your account to get started.
              </p>
            )}
            {!email && (
              <p className="mt-2 text-neu-text-primary/90">
                Create your account to join the community
              </p>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
              {message}
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neu-text-primary mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="neu-input"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neu-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="neu-input pr-12"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neu-text-primary/60 hover:text-neu-text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-neu-text-primary/60 mt-1">
                Must be at least 6 characters
              </p>
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
                  className="neu-input pr-12"
                  placeholder="••••••••"
                  disabled={loading}
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

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="n-button-primary"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Toggle to Sign In */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </StarryContainer>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neu-text-primary">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
