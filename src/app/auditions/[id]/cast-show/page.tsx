'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { getUser } from '@/lib/supabase/auth';
import StarryContainer from '@/components/StarryContainer';
import CastShow from '@/components/casting/CastShow';
import { Alert } from '@/components/ui/feedback';

interface AuditionWithShow {
  audition_id: string;
  show_id: string;
  user_id: string;
  company_id: string | null;
  audition_dates: any;
  audition_location: string | null;
  rehearsal_dates: string | null;
  rehearsal_location: string | null;
  performance_dates: string | null;
  performance_location: string | null;
  ensemble_size: number | null;
  equity_status: 'Equity' | 'Non-Equity' | 'Hybrid' | null;
  show_filled_slots: boolean | null;
  created_at: string;
  updated_at: string | null;
  payment: string | null;
  payment_type: string | null;
  notes: string | null;
  show: {
    title: string;
    author: string | null;
    description: string | null;
  };
  [key: string]: any; // For other properties we might not care about
}

export default function CastShowPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<AuditionWithShow | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isUpdatingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isUpdatingRef.current) return; // Prevent multiple simultaneous updates
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    isUpdatingRef.current = true;
  
    try {
      // Get current user
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);

      // Get audition details with show information
      const { data: auditionData, error: auditionError } = await getAuditionById(params.id as string);
      
      if (auditionError) {
        throw new Error(auditionError.message);
      }

      if (!auditionData) {
        throw new Error('Audition not found');
      }

      // Check if user owns this audition
      if (auditionData.user_id !== currentUser.id) {
        throw new Error('You do not have permission to manage casting for this audition');
      }

      // Only update if the data has actually changed to prevent unnecessary re-renders
      setAudition((prevAudition: any) => {
        if (JSON.stringify(prevAudition) === JSON.stringify(auditionData)) {
          return prevAudition;
        }
        console.log('CastShowPage - auditionData:', auditionData);
        console.log('CastShowPage - show_id:', auditionData.show_id);
        return {
          ...auditionData,
          show: {
            title: auditionData.show?.title || 'Untitled Show',
            author: auditionData.show?.author || null,
            description: auditionData.show?.description || null
          }
        };
      });
    } catch (err: any) {
      console.error('Error loading audition:', err);
      setError(err.message || 'Failed to load audition');
    } finally {
      setLoading(false);
      isUpdatingRef.current = false;
    }
  }, [params.id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = () => {
    setSuccess('Cast assignments saved successfully!');
    // Refresh data to show updates
    loadData();
  };

  const handleError = (error: string) => {
    setError(error);
  };

  if (error) {
    return (
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => router.push(`/auditions/${params.id}`)}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary hover:text-2xl transition-colors flex items-center gap-2"
            >
              ← Back to Audition
            </button>
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
              <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
              <p className="text-neu-text-primary/70">{error}</p>
            </div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  if (loading || !audition) {
    return (
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push(`/auditions/${params.id}`)}
            className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
          >
            ← Back to Audition
          </button>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-6">
              {success}
            </Alert>
          )}
          
          <CastShow
            audition={audition}
            user={user}
            onSave={handleSave}
            onError={handleError}
          />
        </div>
      </div>
    </StarryContainer>
  );
}
