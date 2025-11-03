 'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';

export default function CastPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main cast dashboard
    router.replace('/cast');
  }, [router]);

  return (
    <StarryContainer>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neu-text-primary">Redirecting to cast dashboard...</div>
      </div>
    </StarryContainer>
  );
}