'use client';

import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfileGuidePage() {
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
                Setting Up Your Profile
              </h1>
              <p className="text-lg text-neu-text-primary/70">
                Your profile is your digital calling card in the theater community. Make it shine!
              </p>
            </div>

            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Why Your Profile Matters</h2>
              <p className="text-neu-text-primary/80 mb-4 leading-relaxed">
                A complete profile helps casting directors find you and understand your talents. It's your opportunity to showcase your experience, skills, and personality.
              </p>
            </section>

            {/* Step-by-step guide */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Step-by-Step Setup</h2>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Basic Information</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Start with the essentials. Navigate to your profile and click "Edit Profile."
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                        <li><strong>First Name, Middle Name, Last Name:</strong> Your legal or stage name</li>
                        <li><strong>Username:</strong> A unique handle that appears on your profile</li>
                        <li><strong>Location:</strong> Your city or region (helps with local casting)</li>
                        <li><strong>Bio/Description:</strong> A brief introduction about yourself and your theatrical background</li>
                      </ul>
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
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Profile Photo</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Upload a clear, professional headshot that shows your face well.
                      </p>
                      <div className="bg-neu-accent-warning/10 border border-neu-accent-warning/30 rounded-lg p-4 text-sm text-neu-text-primary/80">
                        <strong>💡 Tip:</strong> Use a high-quality photo with good lighting. Your headshot should be recent and represent how you currently look.
                      </div>
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
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Image Gallery</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Add production photos, character shots, and performance images.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                        <li>Upload multiple images to showcase your range</li>
                        <li>Include variety: headshots, full body, and action shots</li>
                        <li>Keep images professional and theater-related</li>
                      </ul>
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
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Skills & Abilities</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Add your theatrical skills, special abilities, and training.
                      </p>
                      <div className="space-y-2 text-neu-text-primary/80">
                        <p><strong>Examples:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                          <li>Singing (soprano, tenor, belt, etc.)</li>
                          <li>Dance styles (ballet, tap, jazz, contemporary)</li>
                          <li>Accents and dialects</li>
                          <li>Special skills (stage combat, juggling, instruments)</li>
                          <li>Languages spoken</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="neu-card-inset p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-bold">
                      5
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary mb-2">Upload Your Resume</h3>
                      <p className="text-neu-text-primary/70 mb-3">
                        Your theatrical resume is crucial for casting decisions.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-neu-text-primary/80">
                        <li>Upload a PDF of your theatrical resume</li>
                        <li>Include past productions, roles, and training</li>
                        <li>Keep it updated with recent work</li>
                        <li>Format professionally with clear sections</li>
                      </ul>
                      <div className="mt-4 bg-neu-accent-success/10 border border-neu-accent-success/30 rounded-lg p-4 text-sm text-neu-text-primary/80">
                        <strong>✓ Best Practice:</strong> Update your resume after each production to keep it current.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Tips */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">Profile Best Practices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="neu-card-inset p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary mb-1">Be Authentic</h4>
                      <p className="text-sm text-neu-text-primary/70">Represent yourself honestly and accurately</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary mb-1">Stay Current</h4>
                      <p className="text-sm text-neu-text-primary/70">Update regularly with new experience and photos</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary mb-1">Show Range</h4>
                      <p className="text-sm text-neu-text-primary/70">Include variety in your photos and skills</p>
                    </div>
                  </div>
                </div>
                <div className="neu-card-inset p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <h4 className="font-semibold text-neu-text-primary mb-1">Be Professional</h4>
                      <p className="text-sm text-neu-text-primary/70">Maintain a professional tone and appearance</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neu-border">
              <Link href="/profile" className="n-button-primary px-6 py-3 rounded-lg text-center">
                Go to My Profile
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
