'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ShowsGuidePage() {
  return (
    <ProtectedRoute>
      <StarryContainer>
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/help" className="inline-flex items-center text-neu-accent-primary hover:text-neu-accent-secondary mb-6 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Help Center
          </Link>

          <div className="neu-card-raised p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] mb-4">
                Managing Shows
              </h1>
              <p className="text-lg text-neu-text-primary/70">
                Create reusable show templates with roles for streamlined audition posting
              </p>
            </div>

            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">What Are Shows?</h2>
              <p className="text-neu-text-primary/80 mb-4 leading-relaxed">
                Shows are templates in our system. When you create a show, you're building a reusable template that includes all the roles for that production. These templates remain unchanged and can be used multiple times when posting auditions.
              </p>
              <div className="bg-neu-accent-primary/10 border border-neu-accent-primary/30 rounded-lg p-4">
                <p className="text-neu-text-primary/80 text-sm">
                  <strong>💡 How it works:</strong> Create "Hamilton" once with all its roles. When posting an audition for Hamilton, the roles load as templates that you can customize for that specific production without changing the original show.
                </p>
              </div>
            </section>

            {/* Creating a Show */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Creating a New Show</h2>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Navigate to Shows</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Click "Shows" in the main navigation, then click "Create New Show"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Fill in Show Details</h3>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                        <li><strong>Title:</strong> The official name of the show (e.g., "West Side Story")</li>
                        <li><strong>Author:</strong> The playwright or composer(s)</li>
                        <li><strong>Description:</strong> Brief synopsis or notes about the show</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Add Roles</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        After creating the show, you can add all character roles.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                        <li><strong>Character Name:</strong> The role name (e.g., "Tony", "Maria")</li>
                        <li><strong>Description:</strong> Character details, vocal range, age range, etc.</li>
                        <li><strong>Needs Understudy:</strong> Check this if the role requires an understudy casting</li>
                      </ul>
                      <div className="mt-4 bg-neu-accent-success/10 border border-neu-accent-success/30 rounded-lg p-4 text-sm text-neu-text-primary/80">
                        <strong>✓ Understudy Casting:</strong> If a role needs an understudy, check the box. You'll be able to cast both a principal and understudy for that role later.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Save Your Show</h3>
                      <p className="text-neu-text-primary/70">
                        Once all roles are added, your show template is ready to use for auditions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Managing Shows */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Managing Your Shows</h2>
              
              <div className="space-y-4">
                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">🔍 Search Shows</h3>
                  <p className="text-neu-text-primary/70">
                    Use the search bar to quickly find shows by title. Search is debounced to avoid excessive queries.
                  </p>
                </div>

                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">✏️ Edit Shows</h3>
                  <p className="text-neu-text-primary/70">
                    Click on any show to view details, edit information, or manage roles. You can only edit shows you created.
                  </p>
                </div>

                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">🗑️ Delete Shows</h3>
                  <p className="text-neu-text-primary/70 mb-2">
                    Delete shows you no longer need. A confirmation dialog will appear before deletion.
                  </p>
                  <div className="bg-neu-accent-danger/10 border border-neu-accent-danger/30 rounded-lg p-3 text-sm text-neu-text-primary/80">
                    <strong>⚠️ Warning:</strong> Deleting a show will not affect auditions already created using that show template.
                  </div>
                </div>

                <div className="neu-card-inset p-5">
                  <h3 className="text-lg font-semibold text-neu-text-primary mb-2">👥 Manage Roles</h3>
                  <p className="text-neu-text-primary/70">
                    Add, edit, or remove roles from your show template at any time. Changes won't affect existing auditions using this show.
                  </p>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Best Practices</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Create detailed role descriptions including vocal range, age range, and special requirements</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Use consistent naming conventions for easier searching and organization</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Mark roles that need understudies to plan your casting needs appropriately</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Keep show templates organized - delete old ones you no longer use</p>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neu-border">
              <Link href="/shows" className="n-button-primary px-6 py-3 rounded-lg text-center">
                Go to My Shows
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
