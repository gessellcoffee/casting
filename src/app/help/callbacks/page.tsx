'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CallbacksGuidePage() {
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
                Managing Callbacks
              </h1>
              <p className="text-lg text-neu-text-primary/70">
                Send callback invitations and track responses from performers
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">What Are Callbacks?</h2>
              <p className="text-neu-text-primary/80 mb-4 leading-relaxed">
                After initial auditions, you can invite select performers to callbacks for further consideration. The system tracks callback invitations and allows performers to accept or decline.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Accessing Callbacks</h2>
              
              <div className="space-y-6">
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">1</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Navigate to Your Audition</h3>
                      <p className="text-neu-text-primary/70">Go to Cast dashboard and click on your audition, then select "Callbacks" tab</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">2</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Review Applications</h3>
                      <p className="text-neu-text-primary/70">Browse through audition applications to decide who to invite to callbacks</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">3</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Send Callback Invitations</h3>
                      <p className="text-neu-text-primary/70 mb-3">Select performers and send callback invitations individually or in bulk</p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80 text-sm">
                        <li>Click on performer to send individual callback</li>
                        <li>Or use bulk select to invite multiple performers at once</li>
                        <li>Invitations sent via in-app notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">4</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Track Responses</h3>
                      <p className="text-neu-text-primary/70">Monitor who has accepted, declined, or not yet responded to callback invitations</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Callback Status Indicators</h2>
              <div className="space-y-4">
                <div className="neu-card-inset p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary">Pending</h4>
                      <p className="text-sm text-neu-text-primary/70">Invitation sent, awaiting response</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary">Accepted</h4>
                      <p className="text-sm text-neu-text-primary/70">Performer confirmed attendance</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary">Declined</h4>
                      <p className="text-sm text-neu-text-primary/70">Performer cannot attend</p>
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
                  <p>Send callback invitations promptly after initial auditions</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Include callback date, time, and location details in your invitation</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Follow up with performers who haven't responded within a few days</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Keep good notes on each performer for the casting decision process</p>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neu-border">
              <Link href="/cast" className="n-button-primary px-6 py-3 rounded-lg text-center">
                Go to My Auditions
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
