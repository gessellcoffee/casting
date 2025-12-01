'use client';

import { useState, useEffect, useRef } from 'react';
import type {
  MediaFolderWithFiles,
  MediaFile,
} from '@/lib/supabase/types';
import {
  getUserMediaFolders,
  createMediaFolder,
  updateMediaFolder,
  deleteMediaFolder,
  uploadMediaFile,
  updateMediaFile,
  deleteMediaFile,
  moveMediaFile,
} from '@/lib/supabase/mediaManagement';
import Button from '@/components/Button';

interface MediaManagerProps {
  userId: string;
  isEditing: boolean;
}

// Maximum file size: 300MB
const MAX_FILE_SIZE = 300 * 1024 * 1024;

// Format bytes to human-readable size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

export default function MediaManager({ userId, isEditing }: MediaManagerProps) {
  const [folders, setFolders] = useState<MediaFolderWithFiles[]>([]);
  const [currentFolder, setCurrentFolder] = useState<MediaFolderWithFiles | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<MediaFolderWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFolders();
  }, [userId]);

  const loadFolders = async () => {
    setLoading(true);
    const { data, error } = await getUserMediaFolders(userId);
    if (data && !error) {
      setFolders(data);
    }
    setLoading(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const { data, error } = await createMediaFolder({
      user_id: userId,
      folder_name: newFolderName,
      parent_folder_id: currentFolder?.media_folder_id || null,
    });

    if (data && !error) {
      await loadFolders();
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!editFolderName.trim()) return;

    const { error } = await updateMediaFolder(folderId, {
      folder_name: editFolderName,
    });

    if (!error) {
      await loadFolders();
      setEditingFolder(null);
      setEditFolderName('');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Delete "${folderName}" and all its contents? This cannot be undone.`)) {
      return;
    }

    const { success } = await deleteMediaFolder(folderId);
    if (success) {
      await loadFolders();
      if (currentFolder?.media_folder_id === folderId) {
        setCurrentFolder(null);
        setBreadcrumbs([]);
      }
    }
  };

  const handleFolderClick = (folder: MediaFolderWithFiles) => {
    setCurrentFolder(folder);
    setBreadcrumbs([...breadcrumbs, folder]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1]);
      setBreadcrumbs(newBreadcrumbs);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setUploadError(null);

    // Validate file type (videos only)
    if (!file.type.startsWith('video/')) {
      setUploadError('Please upload a video file. Accepted formats: MP4, MOV, AVI, etc.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (300MB max)
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}. Please compress your video or upload a smaller file.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);

    const { data, error } = await uploadMediaFile(
      userId,
      file,
      currentFolder?.media_folder_id || null
    );

    if (data && !error) {
      await loadFolders();
      setUploadError(null);
    } else {
      // Provide detailed error message
      const errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('size') || errorMessage.includes('too large')) {
        setUploadError(
          `Upload failed: File size exceeds server limit. Maximum allowed: ${formatFileSize(MAX_FILE_SIZE)}.`
        );
      } else {
        setUploadError(`Upload failed: ${errorMessage}. Please try again.`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    const { success } = await deleteMediaFile(fileId);
    if (success) {
      await loadFolders();
      setShowFileModal(false);
      setSelectedFile(null);
    }
  };

  const handleUpdateFileDescription = async (fileId: string, description: string) => {
    const { error } = await updateMediaFile(fileId, { description });
    if (!error) {
      await loadFolders();
      if (selectedFile) {
        setSelectedFile({ ...selectedFile, description });
      }
    }
  };

  const getCurrentFolders = (): MediaFolderWithFiles[] => {
    if (!currentFolder) return folders;
    return currentFolder.subfolders;
  };

  const getCurrentFiles = (): MediaFile[] => {
    if (!currentFolder) {
      // Root level - show files without folder_id
      return [];
    }
    return currentFolder.files;
  };

  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-neu-text-primary/70 mb-4 flex-wrap">
      <button
        onClick={() => handleBreadcrumbClick(-1)}
        className="hover:text-neu-text-primary transition-colors"
      >
        📁 My Media
      </button>
      {breadcrumbs.map((folder, index) => (
        <div key={folder.media_folder_id} className="flex items-center gap-2">
          <span>/</span>
          <button
            onClick={() => handleBreadcrumbClick(index)}
            className="hover:text-neu-text-primary transition-colors"
          >
            {folder.folder_name}
          </button>
        </div>
      ))}
    </div>
  );

  const renderFolders = () => {
    const currentFolders = getCurrentFolders();
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {currentFolders.map((folder) => (
          <div
            key={folder.media_folder_id}
            className="neu-card-raised p-4 hover:scale-105 transition-transform cursor-pointer group"
          >
            {editingFolder === folder.media_folder_id && isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="neu-input w-full text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFolder(folder.media_folder_id);
                    if (e.key === 'Escape') {
                      setEditingFolder(null);
                      setEditFolderName('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRenameFolder(folder.media_folder_id)}
                    className="neu-icon-btn-sm neu-icon-btn-success flex-1"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingFolder(null);
                      setEditFolderName('');
                    }}
                    className="neu-icon-btn-sm neu-icon-btn-danger flex-1"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div onClick={() => handleFolderClick(folder)} className="flex flex-col items-center">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-sm font-medium text-neu-text-primary text-center truncate w-full">
                    {folder.folder_name}
                  </div>
                  <div className="text-xs text-neu-text-primary/50 mt-1">
                    {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(folder.media_folder_id);
                        setEditFolderName(folder.folder_name);
                      }}
                      className="neu-icon-btn-sm neu-icon-btn-primary flex-1"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.media_folder_id, folder.folder_name);
                      }}
                      className="neu-icon-btn-sm neu-icon-btn-danger flex-1"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFiles = () => {
    const currentFiles = getCurrentFiles();

    if (currentFiles.length === 0 && !currentFolder) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentFiles.map((file) => (
          <div
            key={file.media_file_id}
            className="neu-card-raised p-4 hover:scale-105 transition-transform cursor-pointer group"
            onClick={() => {
              setSelectedFile(file);
              setShowFileModal(true);
            }}
          >
            <div className="flex flex-col">
              <div className="aspect-video bg-neu-surface-dark/30 rounded-lg mb-2 flex items-center justify-center">
                <div className="text-4xl">🎬</div>
              </div>
              <div className="text-sm font-medium text-neu-text-primary truncate">
                {file.file_name}
              </div>
              {file.description && (
                <div className="text-xs text-neu-text-primary/60 mt-1 truncate">
                  {file.description}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.media_file_id, file.file_name);
                  }}
                  className="neu-icon-btn-sm neu-icon-btn-danger mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-neu-text-primary/70">Loading media...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-neu-text-primary">Virtual Audition Media</h3>
        {isEditing && (
          <div className="flex gap-2">
            <Button
              text={showNewFolderInput ? "Cancel" : "+ New Folder"}
              onClick={() => {
                setShowNewFolderInput(!showNewFolderInput);
                setNewFolderName('');
              }}
              className="neu-button-sm"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {currentFolder && (
              <Button
                text={uploading ? "Uploading..." : "+ Upload Video"}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="neu-button-sm neu-button-primary"
              />
            )}
          </div>
        )}
      </div>

      {renderBreadcrumbs()}

      {/* Upload Error Message */}
      {uploadError && (
        <div className="neu-card-raised p-4 mb-4 bg-red-500/10 border-2 border-red-500/50">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">Upload Error</h4>
              <p className="text-sm text-neu-text-primary/80">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="neu-icon-btn-sm neu-icon-btn-danger"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showNewFolderInput && isEditing && (
        <div className="neu-card-raised p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name (e.g., Monologues)"
              className="neu-input flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }
              }}
            />
            <Button
              text="Create"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="neu-button-primary"
            />
          </div>
        </div>
      )}

      {renderFolders()}
      {renderFiles()}

      {folders.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-neu-text-primary/70 mb-4">
            {isEditing ? "Create your first folder to organize your media" : "No media folders yet"}
          </p>
        </div>
      )}

      {/* File Preview Modal */}
      {showFileModal && selectedFile && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowFileModal(false);
            setSelectedFile(null);
          }}
        >
          <div
            className="neu-modal-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-neu-text-primary">
                {selectedFile.file_name}
              </h3>
              <button
                onClick={() => {
                  setShowFileModal(false);
                  setSelectedFile(null);
                }}
                className="neu-icon-btn-sm neu-icon-btn-danger"
              >
                ✕
              </button>
            </div>

            <video
              src={selectedFile.file_url}
              controls
              className="w-full rounded-lg mb-4"
              style={{ maxHeight: '60vh' }}
            />

            {isEditing ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neu-text-primary/70">
                  Description
                </label>
                <textarea
                  value={selectedFile.description || ''}
                  onChange={(e) =>
                    handleUpdateFileDescription(selectedFile.media_file_id, e.target.value)
                  }
                  className="neu-input w-full"
                  rows={3}
                  placeholder="Add a description..."
                />
              </div>
            ) : (
              selectedFile.description && (
                <div className="text-neu-text-primary/80 whitespace-pre-wrap">
                  {selectedFile.description}
                </div>
              )
            )}

            {isEditing && (
              <div className="mt-4 pt-4 border-t border-neu-border">
                <Button
                  text="Delete Video"
                  onClick={() => handleDeleteFile(selectedFile.media_file_id, selectedFile.file_name)}
                  className="neu-button-danger w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
