'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CompanyGuidePage() {
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
                Setting Up Your Company
              </h1>
              <p className="text-lg text-neu-text-primary/70">
                Manage your theater company with team members and role-based permissions
              </p>
            </div>

            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Why Create a Company?</h2>
              <p className="text-neu-text-primary/80 mb-4 leading-relaxed">
                A company allows you to collaborate with your team, share responsibilities, and maintain a professional presence. You can add team members with different permission levels to help manage auditions and casting.
              </p>
            </section>

            {/* Creating a Company */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Creating Your Company</h2>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Navigate to Company Page</h3>
                      <p className="text-neu-text-primary/70">
                        Click "Company" in the main navigation, then click "Create New Company"
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
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Fill in Company Information</h3>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                        <li><strong>Company Name:</strong> Your organization's official name</li>
                        <li><strong>Description:</strong> Brief overview of your theater company</li>
                        <li><strong>Address:</strong> Physical location (uses Google Places autocomplete)</li>
                        <li><strong>Vision:</strong> Your company's vision statement</li>
                        <li><strong>Mission:</strong> Your company's mission statement</li>
                        <li><strong>Values:</strong> Core values that guide your organization</li>
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
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Add Company Images</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Upload photos of your theater space, past productions, and promotional images.
                      </p>
                      <div className="bg-neu-accent-warning/10 border border-neu-accent-warning/30 rounded-lg p-4 text-sm text-neu-text-primary/80">
                        <strong>💡 Tip:</strong> High-quality images help establish your company's brand and professionalism.
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
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Save Your Company</h3>
                      <p className="text-neu-text-primary/70">
                        Once saved, you become the Owner and can start adding team members.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Company Roles */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Understanding Company Roles</h2>
              
              <div className="space-y-4">
                <div className="neu-card-inset p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👑</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neu-text-primary mb-2">Owner</h3>
                      <p className="text-neu-text-primary/70 mb-2">Full control over the company and all operations.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neu-text-primary/60">
                        <li>Add/remove members and change roles</li>
                        <li>Edit company details</li>
                        <li>Delete company</li>
                        <li>All admin and member permissions</li>
                      </ul>
                      <div className="mt-3 bg-neu-accent-warning/10 border border-neu-accent-warning/30 rounded-lg p-3 text-sm text-neu-text-primary/80">
                        <strong>⚠️ Note:</strong> At least one owner must remain. You cannot remove the last owner.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚙️</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neu-text-primary mb-2">Admin</h3>
                      <p className="text-neu-text-primary/70 mb-2">Manage members and edit company information.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neu-text-primary/60">
                        <li>Add/remove members (except owners)</li>
                        <li>Update member roles (except owners)</li>
                        <li>Edit company details</li>
                        <li>All member permissions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👤</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neu-text-primary mb-2">Member</h3>
                      <p className="text-neu-text-primary/70 mb-2">View and participate in company activities.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neu-text-primary/60">
                        <li>View company information</li>
                        <li>Participate in productions</li>
                        <li>Cannot manage other members</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="neu-card-inset p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">👁️</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neu-text-primary mb-2">Viewer</h3>
                      <p className="text-neu-text-primary/70 mb-2">Read-only access to company information.</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neu-text-primary/60">
                        <li>View company details</li>
                        <li>Cannot make changes or manage members</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Managing Members */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Managing Team Members</h2>
              
              <div className="space-y-6">
                <div className="neu-card-inset p-6">
                  <h3 className="text-xl font-semibold text-neu-text-primary mb-3">Adding Members</h3>
                  <ol className="list-decimal list-inside space-y-2 text-neu-text-primary/80">
                    <li>Click "Manage Members" on your company</li>
                    <li>Click "Add Member" button</li>
                    <li>Search for users by name or email</li>
                    <li>Select their role (Admin, Member, or Viewer)</li>
                    <li>Click "Add" to send the invitation</li>
                  </ol>
                  <div className="mt-4 bg-neu-accent-success/10 border border-neu-accent-success/30 rounded-lg p-4 text-sm text-neu-text-primary/80">
                    <strong>✓ Security:</strong> Only owners and admins can add new members to the company.
                  </div>
                </div>

                <div className="neu-card-inset p-6">
                  <h3 className="text-xl font-semibold text-neu-text-primary mb-3">Changing Member Roles</h3>
                  <p className="text-neu-text-primary/70 mb-3">
                    Owners and admins can update member roles at any time. Simply select a new role from the dropdown next to their name.
                  </p>
                  <p className="text-sm text-neu-text-primary/60">
                    Note: Admins cannot change owner roles. Only owners can manage other owners.
                  </p>
                </div>

                <div className="neu-card-inset p-6">
                  <h3 className="text-xl font-semibold text-neu-text-primary mb-3">Removing Members</h3>
                  <p className="text-neu-text-primary/70 mb-3">
                    Click the remove button next to any member. This is a soft delete - they can be re-added later.
                  </p>
                  <div className="bg-neu-accent-danger/10 border border-neu-accent-danger/30 rounded-lg p-4 text-sm text-neu-text-primary/80">
                    <strong>⚠️ Important:</strong> You cannot remove the last owner. The system ensures at least one owner always exists.
                  </div>
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
                  <p>Use the principle of least privilege - give members only the access they need</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Keep your company information updated with current productions and achievements</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Regularly review team member access and remove inactive members</p>
                </div>
                <div className="flex items-start gap-3 text-neu-text-primary/80">
                  <svg className="w-6 h-6 text-neu-accent-success flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Have multiple owners to ensure continuity if someone leaves</p>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neu-border">
              <Link href="/company" className="n-button-primary px-6 py-3 rounded-lg text-center">
                Go to My Company
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
