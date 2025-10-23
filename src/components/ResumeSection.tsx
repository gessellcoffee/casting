import { useState, useEffect, useRef } from 'react';
import type { UserResume, ResumeSource, Company } from '@/lib/supabase/types';
import {
  getUserResumes,
  createResumeEntry,
  updateResumeEntry,
  deleteResumeEntry,
} from '@/lib/supabase/resume';
import { uploadResume } from '@/lib/supabase/storage';
import { getAllCompanies } from '@/lib/supabase/company';
import ResumeEntry from './ResumeEntry';
import Button from './Button';

interface ResumeSectionProps {
  userId: string;
  isEditing: boolean;
  resumeUrl?: string | null;
  onResumeUrlChange?: (url: string) => void;
}



export default function ResumeSection({ userId, isEditing, resumeUrl, onResumeUrlChange }: ResumeSectionProps) {
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEntry, setNewEntry] = useState({
    company_name: '',
    company_id: '',
    show_name: '',
    role: '',
    date_of_production: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<Pick<Company, 'company_id' | 'name' | 'creator_user_id'>[]>([]);
  const [useCompanyDropdown, setUseCompanyDropdown] = useState(false);

  useEffect(() => {
    loadResumes();
    loadCompanies();
  }, [userId]);

  const loadCompanies = async () => {
    const data = await getAllCompanies();
    setCompanies(data);
  };

  const loadResumes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserResumes(userId);
      setResumes(data);
    } catch (err) {
      console.error('Error loading resumes:', err);
      setError('Failed to load resume entries');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (entryId: string, updates: Partial<UserResume>) => {
    setError(null);
    const { data, error: updateError } = await updateResumeEntry(entryId, updates);
    
    if (updateError) {
      setError('Failed to update resume entry');
      throw updateError;
    }

    if (data) {
      setResumes((prev) =>
        prev.map((r) => (r.resume_entry_id === entryId ? data : r))
      );
      setEditingId(null);
    }
  };

  const handleDelete = async (entryId: string) => {
    setError(null);
    const { success, error: deleteError } = await deleteResumeEntry(entryId);
    
    if (!success || deleteError) {
      setError('Failed to delete resume entry');
      throw deleteError;
    }

    setResumes((prev) => prev.filter((r) => r.resume_entry_id !== entryId));
  };

  const handleNewEntryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // If selecting a company from dropdown, also set the company_name
    if (name === 'company_id' && value) {
      const selectedCompany = companies.find(c => c.company_id === value);
      if (selectedCompany) {
        setNewEntry((prev) => ({ 
          ...prev, 
          company_id: value,
          company_name: selectedCompany.name 
        }));
        return;
      }
    }
    
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanyToggle = () => {
    setUseCompanyDropdown(!useCompanyDropdown);
    if (useCompanyDropdown) {
      // Switching to text input, clear both to start fresh
      setNewEntry((prev) => ({ ...prev, company_id: '', company_name: '' }));
    } else {
      // Switching to dropdown, clear both to start fresh
      setNewEntry((prev) => ({ ...prev, company_name: '', company_id: '' }));
    }
  };

  const handleAddNew = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Prepare entry data
      const entryData: any = {
        user_id: userId,
        show_name: newEntry.show_name,
        role: newEntry.role,
        date_of_production: newEntry.date_of_production,
      };
      
      if (useCompanyDropdown) {
        // Using company dropdown - set both company_id and company_name
        entryData.company_id = newEntry.company_id || null;
        entryData.company_name = newEntry.company_name || null;
      } else {
        // Using manual entry - clear company_id, keep company_name
        entryData.company_id = null;
        entryData.company_name = newEntry.company_name || null;
      }

      const { data, error: createError } = await createResumeEntry(entryData);

      if (createError || !data) {
        console.error('Create error details:', createError);
        throw createError || new Error('Failed to create resume entry');
      }

      setResumes((prev) => [data, ...prev]);
      setNewEntry({
        company_name: '',
        company_id: '',
        show_name: '',
        role: '',
        date_of_production: '',
      });
      setUseCompanyDropdown(false);
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error creating resume entry:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create resume entry';
      setError(`Failed to create resume entry: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNew = () => {
    setNewEntry({
      company_name: '',
      company_id: '',
      show_name: '',
      role: '',
      date_of_production: '',
    });
    setUseCompanyDropdown(false);
    setIsAddingNew(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingResume(true);
    setError(null);

    try {
      const { url, error: uploadError } = await uploadResume(userId, file);
      
      if (uploadError || !url) {
        throw new Error('Failed to upload resume');
      }

      if (onResumeUrlChange) {
        onResumeUrlChange(url);
      }
      setSuccess('Resume uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to upload resume');
      console.error(err);
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border">
        <p className="text-neu-text-primary/70">Loading resume entries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6]">
          Resume
        </h2>
        {isEditing && !isAddingNew && (
          <div className="nav-buttons">
            <Button
              onClick={() => setIsAddingNew(true)}
              text="Add Entry"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
          {success}
        </div>
      )}

      {/* Resume File Upload */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border">
        <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
          Resume File
        </label>
        {resumeUrl ? (
          <div className="flex items-center justify-between">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neu-accent-primary hover:text-[#6a9fff] underline"
            >
              View Resume
            </a>
            {isEditing && (
              <div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <div className="nav-buttons">
                  <Button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    text={uploadingResume ? 'Uploading...' : 'Update Resume'}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {isEditing ? (
              <div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <div className="nav-buttons">
                  <Button
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    text={uploadingResume ? 'Uploading...' : 'Upload Resume'}
                  />
                </div>
              </div>
            ) : (
              <p className="text-neu-text-primary/50">No resume uploaded</p>
            )}
          </div>
        )}
      </div>

      {isAddingNew && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border">
          <h3 className="text-lg font-semibold text-neu-text-primary mb-4">New Resume Entry</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                  Show/Production Name
                </label>
                <input
                  type="text"
                  name="show_name"
                  value={newEntry.show_name}
                  onChange={handleNewEntryChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-neu-border text-neu-text-primary focus:outline-none focus:border-[#5a8ff5] transition-colors"
                  placeholder="Hamlet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={newEntry.role}
                  onChange={handleNewEntryChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-neu-border text-neu-text-primary focus:outline-none focus:border-[#5a8ff5] transition-colors"
                  placeholder="Ophelia"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neu-text-primary/70">
                    Company/Theater
                  </label>
                  <button
                    type="button"
                    onClick={handleCompanyToggle}
                    className="text-xs text-neu-accent-primary hover:text-[#6a9fff] underline"
                  >
                    {useCompanyDropdown ? 'Enter manually' : 'Select from list'}
                  </button>
                </div>
                {useCompanyDropdown ? (
                  <select
                    name="company_id"
                    value={newEntry.company_id}
                    onChange={handleNewEntryChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-neu-border text-neu-text-primary focus:outline-none focus:border-[#5a8ff5] transition-colors"
                  >
                    <option value="">Select a company...</option>
                    {companies.map((company) => (
                      <option key={company.company_id} value={company.company_id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="company_name"
                    value={newEntry.company_name}
                    onChange={handleNewEntryChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-neu-border text-neu-text-primary focus:outline-none focus:border-[#5a8ff5] transition-colors"
                    placeholder="Shakespeare Theater Company"
                  />
                )}
                {useCompanyDropdown && newEntry.company_id && (
                  <p className="text-xs text-neu-text-primary/60 mt-1">
                    ⓘ Company owner will be notified for approval
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                  Date
                </label>
                <input
                  type="text"
                  name="date_of_production"
                  value={newEntry.date_of_production}
                  onChange={handleNewEntryChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1a2332] border border-neu-border text-neu-text-primary focus:outline-none focus:border-[#5a8ff5] transition-colors"
                  placeholder="2024"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 nav-buttons">
              <Button
                onClick={handleCancelNew}
                disabled={saving}
                text="Cancel"
              />
              <Button
                onClick={handleAddNew}
                disabled={saving}
                text={saving ? 'Adding...' : 'Add Entry'}
              />
            </div>
          </div>
        </div>
      )}

      {resumes.length === 0 && !isAddingNew ? (
        <div className="p-8 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border text-center">
          <p className="text-neu-text-primary/70">No resume entries yet.</p>
          {isEditing && (
            <p className="text-neu-text-primary/50 text-sm mt-2">
              Click &quot;Add Entry&quot; to create your first resume entry.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <ResumeEntry
              key={resume.resume_entry_id}
              entry={resume}
              isEditing={isEditing && editingId === resume.resume_entry_id}
              parentIsEditing={isEditing}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onStartEdit={() => setEditingId(resume.resume_entry_id)}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
