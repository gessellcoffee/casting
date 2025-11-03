'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CastingGuidePage() {
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
                Casting Your Show
              </h1>
              <p className="text-lg text-neu-text-primary/70">
                Make casting offers and manage your production cast
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">The Casting Process</h2>
              <p className="text-neu-text-primary/80 mb-4 leading-relaxed">
                After auditions and callbacks, you can make official casting offers to performers. The system tracks offers, responses, and builds your final cast list.
              </p>
              <div className="bg-neu-accent-primary/10 border border-neu-accent-primary/30 rounded-lg p-4">
                <p className="text-neu-text-primary/80 text-sm">
                  <strong>💡 Dual Notifications:</strong> Casting offers are sent via both email and in-app notifications, with action buttons for accept/decline.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Making Casting Offers</h2>
              
              <div className="space-y-6">
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">1</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Access Cast Show Page</h3>
                      <p className="text-neu-text-primary/70">Navigate to your audition and select "Cast Show" to begin making offers</p>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">2</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Review Performers</h3>
                      <p className="text-neu-text-primary/70 mb-3">See all performers who auditioned, including those who attended callbacks</p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80 text-sm">
                        <li>View profiles and performance history</li>
                        <li>Review audition notes and feedback</li>
                        <li>Check availability and skills</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">3</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Send Casting Offers</h3>
                      <p className="text-neu-text-primary/70 mb-3">Make offers to selected performers for specific roles</p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80 text-sm">
                        <li><strong>Individual Offers:</strong> Send one at a time with personalized message</li>
                        <li><strong>Bulk Offers:</strong> Send multiple offers simultaneously</li>
                        <li><strong>Role Assignment:</strong> Specify which role(s) you're offering</li>
                        <li><strong>Understudy Option:</strong> Mark if offering as understudy</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">4</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Track Responses</h3>
                      <p className="text-neu-text-primary/70">Monitor offer status and responses in real-time</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Understanding Understudy Casting</h2>
              <div className="neu-card-inset p-6">
                <p className="text-neu-text-primary/80 mb-4">
                  Roles marked as "needs understudy" can have both a principal and understudy cast. This is a single role with dual casting, not two separate role entries.
                </p>
                <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                  <li>One principal actor per role</li>
                  <li>One understudy actor per role (if needed)</li>
                  <li>Both assigned to the same role with different casting flags</li>
                  <li>System prevents duplicate assignments</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Offer Status Tracking</h2>
              <div className="space-y-4">
                <div className="neu-card-inset p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary">Offered</h4>
                      <p className="text-sm text-neu-text-primary/70">Offer sent, awaiting performer response</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary">Accepted</h4>
                      <p className="text-sm text-neu-text-primary/70">Performer accepted the role - they're now in your cast</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary">Declined</h4>
                      <p className="text-sm text-neu-text-primary/70">Performer declined - you can offer the role to someone else</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Managing Your Cast</h2>
              <div className="space-y-4">
                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">📋 View Cast List</h3>
                  <p className="text-neu-text-primary/70">See your complete cast with all roles filled. Export or print for rehearsals.</p>
                </div>
                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">🔄 Resend Offers</h3>
                  <p className="text-neu-text-primary/70">If a performer hasn't responded, you can resend the offer notification.</p>
                </div>
                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">✏️ Recast Roles</h3>
                  <p className="text-neu-text-primary/70">If an offer is declined or circumstances change, you can reassign roles.</p>
                </div>
                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">📊 View Statistics</h3>
                  <p className="text-neu-text-primary/70">Track offer acceptance rates and casting progress.</p>
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
                  <p>Send offers promptly after making casting decisions</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Include important details like rehearsal dates and commitment requirements</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Give performers reasonable time to respond (typically 48-72 hours)</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Have backup choices ready in case offers are declined</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Communicate professionally and maintain good relationships with all performers</p>
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
