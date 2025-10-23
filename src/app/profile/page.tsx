'use client';

import { useEffect, useState, useRef } from 'react';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import ImageGalleryUpload from '@/components/ImageGalleryUpload';
import ResumeSection from '@/components/ResumeSection';
import { getUser } from '@/lib/supabase';
import { getProfile, updateProfile } from '@/lib/supabase/profile';
import { uploadProfilePhoto } from '@/lib/supabase/storage';
import type { Profile } from '@/lib/supabase/types';
import Button from '@/components/Button';
import SkillsSection from '@/components/SkillsSection';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    username: '',
    description: '',
    profile_photo_url: '',
    resume_url: '',
    image_gallery: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser();
        setUser(userData);

        if (userData?.id) {
          const profileData = await getProfile(userData.id);
          setProfile(profileData);
          
          if (profileData) {
            setFormData({
              first_name: profileData.first_name || '',
              middle_name: profileData.middle_name || '',
              last_name: profileData.last_name || '',
              username: profileData.username || '',
              description: profileData.description || '',
              profile_photo_url: profileData.profile_photo_url || '',
              resume_url: profileData.resume_url || '',
              image_gallery: Array.isArray(profileData.image_gallery) 
                ? profileData.image_gallery 
                : [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingPhoto(true);
    setError(null);

    try {
      const { url, error: uploadError } = await uploadProfilePhoto(user.id, file);
      
      if (uploadError || !url) {
        throw new Error('Failed to upload photo');
      }

      setFormData(prev => ({ ...prev, profile_photo_url: url }));
      setSuccess('Photo uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to upload photo');
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, resume_url: url }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: updateError } = await updateProfile(user.id, {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        username: formData.username,
        description: formData.description,
        profile_photo_url: formData.profile_photo_url,
        resume_url: formData.resume_url,
        image_gallery: formData.image_gallery,
      });

      if (updateError) {
        throw new Error('Failed to update profile');
      }

      setProfile(data);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        middle_name: profile.middle_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        description: profile.description || '',
        profile_photo_url: profile.profile_photo_url || '',
        resume_url: profile.resume_url || '',
        image_gallery: Array.isArray(profile.image_gallery) 
          ? profile.image_gallery 
          : [],
      });
    }
    setIsEditing(false);
    setError(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-4xl">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
                My Profile
              </h1>
              
              {!isEditing ? (
                <div className="nav-buttons">
                  <Button 
                    onClick={() => setIsEditing(true)}
                    text="Edit Profile"
                  />
                </div>
              ) : (
                <div className="nav-buttons">
                  <Button
                    onClick={handleCancel}
                    disabled={saving}
                    text="Cancel"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    text={saving ? 'Saving...' : 'Save Changes'}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
                {success}
              </div>
            )}

            {loading ? (
              <div className="text-neu-text-primary/90">Loading profile...</div>
            ) : user ? (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {formData.profile_photo_url ? (
                      <img
                        src={formData.profile_photo_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full border-4 border-neu-border object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full border-4 border-neu-border bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 flex items-center justify-center">
                        <svg className="w-16 h-16 text-[#4a7bd9]/50" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                        <Button
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          text={uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                          className="neu-button-primary"
                        />
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="justify-center items-center grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card w-full">
                    <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text" 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="neu-input"
                      />
                    ) : (
                      <p className="text-neu-text-primary">{formData.first_name || 'Not set'}</p>
                    )}
                  </div>

                  <div className="card w-full">
                    <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                      Middle Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleInputChange}
                        className="neu-input"
                      />
                    ) : (
                      <p className="text-neu-text-primary">{formData.middle_name || 'Not set'}</p>
                    )}
                  </div>

                  <div className="card p-4 w-full">
                    <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="neu-input"
                      />
                    ) : (
                      <p className="text-neu-text-primary">{formData.last_name || 'Not set'}</p>
                    )}
                  </div>

                  <div className="card w-full">
                    <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                      Username
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="neu-input"
                      />
                    ) : (
                      <p className="text-neu-text-primary">{formData.username || 'Not set'}</p>
                    )}
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div className="card w-full">
                  <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                    Email
                  </label>
                  <p className="text-neu-text-primary">{user.email}</p>
                </div>

                {/* Description */}
                <div className="card w-full">
                  <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                    Bio / Description
                  </label>
                  {isEditing ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="neu-input"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-neu-text-primary whitespace-pre-wrap">{formData.description || 'Not set'}</p>
                  )}
                </div>


                {/* Image Gallery */}
                {isEditing && user?.id && (
                  <div className="card w-full">
                    <ImageGalleryUpload
                      userId={user.id}
                      images={formData.image_gallery}
                      onImagesChange={(images) => setFormData(prev => ({ ...prev, image_gallery: images }))}
                    />
                  </div>
                )}

                {!isEditing && formData.image_gallery.length > 0 && (
                  <div className="card w-full">
                    <label className="block text-sm font-medium text-neu-text-primary/70 mb-4">
                      Image Gallery
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.image_gallery.map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border border-neu-border">
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
                {/*Skills Section*/}
                {isEditing && user?.id && (
                  <div className="card w-full">
                    <SkillsSection userId={user.id} isEditing={isEditing} />
                  </div>
                )}

                {/* Resume Section */}
                {user?.id && (
                  <div className="card w-full">
                    <ResumeSection 
                      userId={user.id} 
                      isEditing={isEditing}
                      resumeUrl={formData.resume_url}
                      onResumeUrlChange={handleResumeUrlChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-neu-text-primary/90">No user data available</div>
            )}
          </div>
        </StarryContainer>
      </div>
    </ProtectedRoute>
  );
}
