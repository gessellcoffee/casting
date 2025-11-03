'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AuditionsGuidePage() {
  return (
    <ProtectedRoute>
      <StarryContainer>
        <div className="max-w-4xl mx-auto">
          <Link href="/help" className="inline-flex items-center text-neu-accent-primary hover:text-neu-accent-secondary mb-6 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Help Center
          </Link>

          <div className="neu-card-raised p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] mb-4">
                Posting an Audition
              </h1>
              <p className="text-lg text-neu-text-primary/70">
                Create and publish audition opportunities for your productions
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Creating an Audition</h2>
              
              <div className="space-y-6">
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">1</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Navigate to Cast Section</h3>
                      <p className="text-neu-text-primary/70">Click "Cast" in the main navigation, then "Create New Audition"</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">2</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Select Show Template</h3>
                      <p className="text-neu-text-primary/70">Choose from existing shows. Roles load automatically as starting point.</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">3</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Fill in Details</h3>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80 text-sm">
                        <li>Production title and description</li>
                        <li>Audition location (Google Places autocomplete)</li>
                        <li>Audition dates (multiple dates supported)</li>
                        <li>Rehearsal and performance dates</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">4</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Customize Roles</h3>
                      <p className="text-neu-text-primary/70 mb-2">Edit roles for this production. Changes don't affect original show template.</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">5</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Set Up Audition Slots</h3>
                      <p className="text-neu-text-primary/70">Create time slots with start/end times and slot duration. System generates available slots automatically.</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">6</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Publish</h3>
                      <p className="text-neu-text-primary/70">Review and click "Create Audition" to publish to public listings.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Best Practices</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Provide clear, detailed role descriptions including requirements and expectations</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Schedule enough audition slots to accommodate all interested performers</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Post auditions well in advance to give performers time to prepare</p>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neu-border">
              <Link href="/cast/new" className="n-button-primary px-6 py-3 rounded-lg text-center">
                Create Audition
              </Link>
              <Link href="/help" className="n-button-secondary px-6 py-3 rounded-lg text-center">
                Back to Help Center
              </Link>
            </div>
          </div>
        </div>
      </StarryContainer>
    </ProtectedRoute>
  );
}
