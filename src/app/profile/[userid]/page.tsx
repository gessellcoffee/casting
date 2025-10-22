'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import { getProfile } from '@/lib/supabase/profile';
import { getUserResumes } from '@/lib/supabase/resume';
import type { Profile, UserResume } from '@/lib/supabase/types';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userid as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch profile
        const profileData = await getProfile(userId);
        if (!profileData) {
          setError('User not found');
          return;
        }
        setProfile(profileData);
        
        // Fetch resume entries
        const resumeData = await getUserResumes(userId);
        setResumes(resumeData);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-4xl">
          <div className="p-8 text-center text-[#c5ddff]/90">
            Loading profile...
          </div>
        </StarryContainer>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-4xl">
          <div className="p-8 text-center">
            <p className="text-[#c5ddff]/90 mb-4">{error || 'User not found'}</p>
            <Link 
              href="/"
              className="text-[#5a8ff5] hover:text-[#6a9fff] underline"
            >
              Return to Home
            </Link>
          </div>
        </StarryContainer>
      </div>
    );
  }

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ') || profile.username || 'Anonymous User';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <StarryContainer starCount={15} className="card w-full max-w-4xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              {fullName}
            </h1>
          </div>

          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={fullName}
                    className="w-32 h-32 rounded-full border-4 border-[#4a7bd9]/30 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-[#4a7bd9]/30 bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 flex items-center justify-center">
                    <svg className="w-16 h-16 text-[#4a7bd9]/50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.username && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#4a7bd9]/20">
                  <label className="block text-sm font-medium text-[#b5ccff]/70 mb-2">
                    Username
                  </label>
                  <p className="text-[#c5ddff]">{profile.username}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {profile.description && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#4a7bd9]/20">
                <label className="block text-sm font-medium text-[#b5ccff]/70 mb-2">
                  Bio
                </label>
                <p className="text-[#c5ddff] whitespace-pre-wrap">{profile.description}</p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#4a7bd9]/20">
                <label className="block text-sm font-medium text-[#b5ccff]/70 mb-3">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-[#4a7bd9]/20 border border-[#4a7bd9]/30 text-[#c5ddff] text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {profile.image_gallery && Array.isArray(profile.image_gallery) && profile.image_gallery.length > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#4a7bd9]/20">
                <label className="block text-sm font-medium text-[#b5ccff]/70 mb-4">
                  Gallery
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.image_gallery.map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden border border-[#4a7bd9]/20">
                      <img
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Section */}
            {resumes.length > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#4a7bd9]/20">
                <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] mb-4">
                  Resume
                </h2>
                
                {/* Resume File Link */}
                {profile.resume_url && (
                  <div className="mb-4">
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5a8ff5] hover:text-[#6a9fff] underline"
                    >
                      View Resume File
                    </a>
                  </div>
                )}

                {/* Resume Entries */}
                <div className="space-y-4">
                  {resumes.map((resume) => (
                    <div
                      key={resume.resume_entry_id}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#4a7bd9]/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-[#c5ddff] mb-1">
                              {resume.show_name || 'Untitled Production'}
                            </h3>
                            {(resume.source === 'application' || resume.company_approved) && (
                              <svg
                                className="w-5 h-5 text-green-400 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <title>{resume.company_approved ? 'Approved by company' : 'Verified from application'}</title>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                            {resume.company_id && resume.company_approved === null && (
                              <svg
                                className="w-5 h-5 text-yellow-400 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <title>Pending company approval</title>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-[#5a8ff5] font-medium">
                            {resume.role || 'Role not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-[#b5ccff]/80">
                        {resume.company_name && (
                          <p>
                            <span className="text-[#b5ccff]/60">Company: </span>
                            {resume.company_name}
                          </p>
                        )}
                        {resume.date_of_production && (
                          <p>
                            <span className="text-[#b5ccff]/60">Date: </span>
                            {resume.date_of_production}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </StarryContainer>
    </div>
  );
}
