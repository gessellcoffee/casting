'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import { getUser } from '@/lib/supabase/auth';
import { getMyAuditionSignupFormAssignments, getMyFormAssignments } from '@/lib/supabase/customForms';

function MyFormsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const auditionId = searchParams.get('auditionId');
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    loadData();
  }, [auditionId]);

  const loadData = async () => {
    setLoading(true);

    const user = await getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const list = auditionId ? await getMyAuditionSignupFormAssignments(auditionId) : await getMyFormAssignments();
    setAssignments(list);
    setLoading(false);
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading your forms...</div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neu-text-primary mb-2">
              {auditionId ? 'Required Forms' : 'My Forms'}
            </h1>
            <p className="text-neu-text-primary/70">
              {auditionId ? 'Complete these forms before signing up.' : 'Forms you need to complete.'}
            </p>
            {returnTo && (
              <div className="mt-3">
                <Link href={returnTo} className="neu-link">← Back</Link>
              </div>
            )}
            {!returnTo && auditionId && (
              <div className="mt-3">
                <Link href={`/auditions/${auditionId}`} className="neu-link">← Back to Audition</Link>
              </div>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="neu-card-raised rounded-xl p-8 text-center">
              <div className="text-neu-text-primary/70">No assigned forms right now.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((a) => {
                const formName = a.form?.name || 'Untitled Form';
                const statusClass = a.is_complete ? 'neu-badge-success' : 'neu-badge-warning';
                const statusLabel = a.is_complete ? 'Complete' : 'Pending';

                return (
                  <div key={a.assignment_id} className="neu-card-raised rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-semibold text-neu-text-primary">{formName}</h2>
                          <span className={`${statusClass} text-xs`}>{statusLabel}</span>
                        </div>
                        <div className="text-sm text-neu-text-primary/60">
                          Assigned {new Date(a.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {a.is_complete ? (
                          <>
                            <Link
                              href={`/my-forms/${a.assignment_id}?mode=view${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                            >
                              <button className="n-button-secondary">
                                View Response
                              </button>
                            </Link>
                            <Link
                              href={`/my-forms/${a.assignment_id}?mode=edit${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                            >
                              <button className="n-button-primary">
                                Edit Response
                              </button>
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={`/my-forms/${a.assignment_id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                          >
                            <button className="n-button-primary">
                              Fill Out
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}

export default function MyFormsPage() {
  return (
    <Suspense fallback={
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading your forms...</div>
        </div>
      </StarryContainer>
    }>
      <MyFormsPageContent />
    </Suspense>
  );
}
