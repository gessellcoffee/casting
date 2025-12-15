'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getUserVirtualAudition,
  getVirtualAuditionWithMedia,
  upsertVirtualAudition,
  deleteVirtualAudition,
  getUserVideoFiles,
  canUserSubmitVirtualAudition
} from '@/lib/supabase/virtualAuditions';
import { uploadMediaFile } from '@/lib/supabase/mediaManagement';
import { getUser } from '@/lib/supabase/auth';
import type { MediaFile } from '@/lib/supabase/types';
import Button from '@/components/Button';
import { Upload, X, Video, Check, Trash2 } from 'lucide-react';

interface VirtualAuditionSubmissionProps {
  auditionId: string;
  instructions: string | null;
}

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

export default function VirtualAuditionSubmission({ 
  auditionId, 
  instructions 
}: VirtualAuditionSubmissionProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Existing submission state
  const [hasSubmission, setHasSubmission] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<MediaFile[]>([]);
  
  // Video library state
  const [userVideos, setUserVideos] = useState<MediaFile[]>([]);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialize();
  }, [auditionId]);

  const initialize = async () => {
    setLoading(true);
    setErrorMessage(null);

    const currentUser = await getUser();
    if (!currentUser) {
      setErrorMessage('You must be logged in to submit a virtual audition');
      setLoading(false);
      return;
    }
    setUser(currentUser);

    // Check if user can submit
    const { canSubmit: allowed, reason } = await canUserSubmitVirtualAudition(
      auditionId,
      currentUser.id
    );
    
    if (!allowed) {
      setErrorMessage(reason || 'Cannot submit virtual audition');
      setCanSubmit(false);
      setLoading(false);
      return;
    }
    
    setCanSubmit(true);

    // Check for existing submission
    const { data: existing } = await getUserVirtualAudition(auditionId, currentUser.id);
    
    if (existing) {
      setHasSubmission(true);
      setSubmissionNotes(existing.submission_notes || '');
      
      // Load existing media
      const { data: withMedia } = await getVirtualAuditionWithMedia(
        existing.virtual_audition_id
      );
      
      if (withMedia?.media_files) {
        setExistingVideos(withMedia.media_files);
        setSelectedVideoIds(withMedia.media_files.map(f => f.media_file_id));
      }
    }

    // Load user's video library
    const { data: videos } = await getUserVideoFiles(currentUser.id);
    setUserVideos(videos || []);

    setLoading(false);
  };

  const handleVideoSelection = (videoId: string) => {
    if (selectedVideoIds.includes(videoId)) {
      setSelectedVideoIds(selectedVideoIds.filter(id => id !== videoId));
    } else {
      setSelectedVideoIds([...selectedVideoIds, videoId]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Please select a video file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const { data, error } = await uploadMediaFile(
        user.id,
        file,
        null // No folder, goes to root
      );

      if (error || !data) {
        setUploadError(error?.message || 'Failed to upload video');
        return;
      }

      // Add to user videos and select it
      setUserVideos([data, ...userVideos]);
      setSelectedVideoIds([...selectedVideoIds, data.media_file_id]);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!user || selectedVideoIds.length === 0) {
      setErrorMessage('Please select at least one video');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const { data, error } = await upsertVirtualAudition(
      auditionId,
      user.id,
      submissionNotes || null,
      selectedVideoIds
    );

    if (error) {
      setErrorMessage(error.message || 'Failed to submit virtual audition');
      setSubmitting(false);
      return;
    }

    setHasSubmission(true);
    setSubmitting(false);
    setShowVideoSelector(false);
    
    // Reload to show updated submission
    await initialize();
  };

  const handleDelete = async () => {
    if (!user || !hasSubmission) return;

    if (!confirm('Are you sure you want to delete your virtual audition submission?')) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const { data: existing } = await getUserVirtualAudition(auditionId, user.id);
    if (!existing) {
      setErrorMessage('No submission found');
      setSubmitting(false);
      return;
    }

    const { success, error } = await deleteVirtualAudition(
      existing.virtual_audition_id,
      user.id
    );

    if (!success || error) {
      setErrorMessage(error?.message || 'Failed to delete submission');
      setSubmitting(false);
      return;
    }

    // Reset state
    setHasSubmission(false);
    setSubmissionNotes('');
    setSelectedVideoIds([]);
    setExistingVideos([]);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="neu-card-raised p-6">
        <div className="text-neu-text-primary/70">Loading...</div>
      </div>
    );
  }

  if (!canSubmit) {
    return (
      <div className="neu-card-raised p-6">
        <div className="flex items-center gap-3 text-neu-danger">
          <X className="w-5 h-5" />
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const selectedVideos = userVideos.filter(v => selectedVideoIds.includes(v.media_file_id));

  return (
    <div className="neu-card-raised p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-neu-text-primary flex items-center gap-2">
          <Video className="w-6 h-6 text-neu-accent-primary" />
          Virtual Audition
        </h3>
        {hasSubmission && (
          <div className="flex items-center gap-2 text-neu-success">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Submitted</span>
          </div>
        )}
      </div>

      {instructions && (
        <div className="neu-card-inset p-4 bg-neu-accent-primary/5 border border-neu-accent-primary/20">
          <h4 className="font-semibold text-neu-text-primary mb-2">Instructions:</h4>
          <p className="text-neu-text-secondary whitespace-pre-wrap">{instructions}</p>
        </div>
      )}

      {errorMessage && (
        <div className="neu-card-inset p-4 bg-neu-danger/10 border border-neu-danger/20">
          <p className="text-neu-danger">{errorMessage}</p>
        </div>
      )}

      {/* Submission Notes */}
      <div>
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={submissionNotes}
          onChange={(e) => setSubmissionNotes(e.target.value)}
          placeholder="Add any notes about your submission..."
          className="w-full px-4 py-3 bg-neu-surface border border-neu-border rounded-lg text-neu-text-primary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50 min-h-[100px]"
          disabled={submitting}
        />
      </div>

      {/* Selected Videos */}
      <div>
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          Selected Videos ({selectedVideos.length})
        </label>
        
        {selectedVideos.length === 0 ? (
          <div className="neu-card-inset p-4 text-center text-neu-text-secondary">
            No videos selected
          </div>
        ) : (
          <div className="space-y-2">
            {selectedVideos.map((video) => (
              <div
                key={video.media_file_id}
                className="neu-card-inset p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-neu-accent-primary" />
                  <div>
                    <p className="text-neu-text-primary font-medium">{video.file_name}</p>
                    <p className="text-xs text-neu-text-secondary">
                      {formatFileSize(video.file_size)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleVideoSelection(video.media_file_id)}
                  className=""
                  disabled={submitting}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Selection/Upload */}
      {showVideoSelector ? (
        <div className="neu-card-inset p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-neu-text-primary">Select Videos</h4>
            <Button
              onClick={() => setShowVideoSelector(false)}
              variant="secondary"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Upload New */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="secondary"
              className="w-full"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload New Video'}
            </Button>
            {uploadError && (
              <p className="text-sm text-neu-danger mt-2">{uploadError}</p>
            )}
            <p className="text-xs text-neu-text-secondary mt-2">
              Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>

          {/* Video Library */}
          {userVideos.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-neu-text-primary mb-2">
                Your Video Library
              </h5>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {userVideos.map((video) => {
                  const isSelected = selectedVideoIds.includes(video.media_file_id);
                  return (
                    <Button
                      key={video.media_file_id}
                      onClick={() => handleVideoSelection(video.media_file_id)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-neu-accent-primary bg-neu-accent-primary/10'
                          : 'border-neu-border hover:border-neu-accent-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-neu-accent-primary bg-neu-accent-primary'
                            : 'border-neu-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-neu-text-primary dark:text-white" />}
                        </div>
                        <Video className="w-5 h-5 text-neu-accent-primary" />
                        <div className="flex-1">
                          <p className="text-neu-text-primary font-medium">{video.file_name}</p>
                          <p className="text-xs text-neu-text-secondary">
                            {formatFileSize(video.file_size)}
                          </p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={() => setShowVideoSelector(true)}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
          disabled={submitting}
        >
          <Video className="w-4 h-4" />
          {selectedVideos.length > 0 ? 'Change Videos' : 'Select Videos'}
        </Button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting || selectedVideoIds.length === 0}
          className="flex-1"
        >
          {submitting ? 'Submitting...' : hasSubmission ? 'Update Submission' : 'Submit Virtual Audition'}
        </Button>
        
        {hasSubmission && (
          <Button
            onClick={handleDelete}
            disabled={submitting}
            variant="danger"
            className="neu-icon-btn-danger"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
