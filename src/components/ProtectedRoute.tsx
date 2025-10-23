'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Client-side protected route wrapper
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  loadingComponent 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push(redirectTo);
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push(redirectTo);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  if (isAuthenticated === null) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neu-text-primary/90">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
