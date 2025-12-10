import { useState, useEffect, useRef } from 'react';
import type { UserResume, ResumeSource, Company, Profile } from '@/lib/supabase/types';
import {
  getUserResumes,
  createResumeEntry,
  updateResumeEntry,
  deleteResumeEntry,
} from '@/lib/supabase/resume';
import { getUserCastingHistory } from '@/lib/supabase/castingHistory';
import { uploadResume } from '@/lib/supabase/storage';
import { getAllCompanies } from '@/lib/supabase/company';
import { generateResumePDF } from '@/lib/utils/pdfGenerator';
import ResumeEntry from './ResumeEntry';
import Button from './Button';
import ResumeImporter from './ResumeImporter';
import PDFViewer from './PDFViewer';
import type { ParsedResumeEntry } from '@/lib/utils/resumeParser';

interface ResumeSectionProps {
  userId: string;
  isEditing: boolean;
  resumeUrl?: string | null;
  onResumeUrlChange?: (url: string) => void;
  isOwnProfile?: boolean;
  showCastingHistory?: boolean;
  profile?: Profile | null;
}



export default function ResumeSection({ 
  userId, 
  isEditing, 
  resumeUrl, 
  onResumeUrlChange,
  isOwnProfile = false,
  showCastingHistory = true,
  profile = null
}: ResumeSectionProps) {
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [castingHistory, setCastingHistory] = useState<any[]>([]);
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
  const [showImporter, setShowImporter] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  const manualResumes = resumes.filter((resume) => resume.source !== 'Application');

  useEffect(() => {
    loadResumes();
    loadCastingHistory();
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

  const loadCastingHistory = async () => {
    try {
      const history = await getUserCastingHistory(userId);
      setCastingHistory(history);
    } catch (err) {
      console.error('Error loading casting history:', err);
      // Don't set error - casting history is supplementary
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

  const handleExportPDF = async () => {
    if (!profile) {
      setError('Profile data not available');
      return;
    }

    try {
      await generateResumePDF({
        profile,
        manualResumes,
        castingHistory: castingHistory,
      });
      setSuccess('Resume exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to export resume');
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
    <div className="space-y-4 neu-card-raised">
      <div className=" flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6]">
          Resume
        </h2>
        <div className="nav-buttons">
          {resumeUrl && (
            <Button
              onClick={() => setShowPDFViewer(true)}
              text="📄 View Resume"
            />
          )}
          {isOwnProfile && profile && (
            <Button
              onClick={handleExportPDF}
              text="Export as PDF"
            />
          )}
          {isEditing && !isAddingNew && (
            <>
              <Button
                onClick={() => setShowImporter(true)}
                text="📄 Import Resume"
                className='recommended-button'
              />
              <Button
                onClick={() => setIsAddingNew(true)}
                text="Add Entry"
              />
            </>
          )}
        </div>
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
      <div className="p-4 rounded-xl neu-card-raised">
        <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
          Resume File
        </label>
        {resumeUrl ? (
          <div className="flex items-center justify-between neu-card-raised">
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
        <div className="p-4 rounded-xl neu-card-raised">
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
                  className="neu-input"
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
                  className="neu-input"
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
                    className="neu-input"
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
                    className="neu-input"
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
                  className="neu-input"
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

      {/* Casting History Section */}
      {castingHistory.length > 0 && (isOwnProfile || showCastingHistory) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-neu-text-primary">
              Casting History
            </h3>
            <span className="text-xs text-neu-text-primary/60 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full">
              ✓ Verified from Castings
            </span>
          </div>
          <div className="space-y-4">
            {castingHistory.map((cast) => (
              <div key={cast.id} className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 neu-card-raised">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-neu-text-primary mb-1">
                        {cast.show_name}
                      </h3>
                      <svg
                        className="w-5 h-5 text-green-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <title>Verified from casting system</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-neu-accent-primary font-medium">
                      {cast.role}{cast.is_understudy && ' (Understudy)'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-neu-text-primary/80">
                  {cast.company_name && (
                    <p>
                      <span className="text-neu-text-primary/60">Company: </span>
                      {cast.company_name}
                    </p>
                  )}
                  {cast.date_of_production && (
                    <p>
                      <span className="text-neu-text-primary/60">Performance Dates: </span>
                      {cast.date_of_production}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Resume Entries Section */}
      {manualResumes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neu-text-primary">
            Additional Credits
          </h3>
          <div className="space-y-4">
            {manualResumes.map((resume) => (
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
        </div>
      )}

      {/* Empty State */}
      {manualResumes.length === 0 && castingHistory.length === 0 && !isAddingNew && (
        <div className="p-8 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border text-center">
          <p className="text-neu-text-primary/70">No resume entries yet.</p>
          {isEditing && (
            <p className="text-neu-text-primary/50 text-sm mt-2">
              Click &quot;Add Entry&quot; to create your first resume entry.
            </p>
          )}
        </div>
      )}

      {/* Resume Importer Modal */}
      {showImporter && (
        <ResumeImporter
          onImport={async (entries: ParsedResumeEntry[]) => {
            setError(null);
            setSaving(true);
            
            try {
              // Import each entry
              for (const entry of entries) {
                await createResumeEntry({
                  user_id: userId,
                  resume_data: {}, 
                  company_name: entry.company || '',
                  company_id: null,
                  show_name: entry.show_name,
                  role: entry.role_name,
                  date_of_production: entry.year ? entry.year.toString() : '',
                  source: 'manual' as ResumeSource,
                });
              }
              
              // Reload resumes
              await loadResumes();
              
              // Show success message
              setSuccess(`Successfully imported ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}!`);
              setTimeout(() => setSuccess(null), 5000);
              
              setShowImporter(false);
            } catch (err) {
              console.error('Import error:', err);
              setError('Failed to import resume entries. Please try again.');
            } finally {
              setSaving(false);
            }
          }}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && resumeUrl && (
        <PDFViewer
          pdfUrl={resumeUrl}
          onClose={() => setShowPDFViewer(false)}
          fileName={`${profile?.first_name || 'User'}_${profile?.last_name || 'Resume'}.pdf`}
        />
      )}
    </div>
  );
}
