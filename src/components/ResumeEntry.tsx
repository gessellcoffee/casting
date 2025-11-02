import { useState, useEffect } from 'react';
import type { UserResume, ResumeSource, Company } from '@/lib/supabase/types';
import Button from './Button';
import { getAllCompanies } from '@/lib/supabase/company';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';

interface ResumeEntryProps {
  entry: UserResume;
  isEditing: boolean;
  parentIsEditing: boolean;
  onUpdate: (entryId: string, updates: Partial<UserResume>) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}



export default function ResumeEntry({
  entry,
  isEditing,
  parentIsEditing,
  onUpdate,
  onDelete,
  onStartEdit,
  onCancelEdit,
}: ResumeEntryProps) {
  const [formData, setFormData] = useState({
    company_name: entry.company_name || '',
    company_id: entry.company_id || '',
    show_name: entry.show_name || '',
    role: entry.role || '',
    date_of_production: entry.date_of_production || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [companies, setCompanies] = useState<Pick<Company, 'company_id' | 'name' | 'creator_user_id'>[]>([]);
  const [useCompanyDropdown, setUseCompanyDropdown] = useState(!!entry.company_id);

  useEffect(() => {
    const loadCompanies = async () => {
      const data = await getAllCompanies();
      setCompanies(data);
    };
    loadCompanies();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // If selecting a company from dropdown, also set the company_name
    if (name === 'company_id' && value) {
      const selectedCompany = companies.find(c => c.company_id === value);
      if (selectedCompany) {
        setFormData((prev) => ({ 
          ...prev, 
          company_id: value,
          company_name: selectedCompany.name 
        }));
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanyToggle = () => {
    setUseCompanyDropdown(!useCompanyDropdown);
    if (useCompanyDropdown) {
      // Switching to text input, clear company_id but keep company_name
      setFormData((prev) => ({ ...prev, company_id: '', company_name: '' }));
    } else {
      // Switching to dropdown, clear both to start fresh
      setFormData((prev) => ({ ...prev, company_name: '', company_id: '' }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare update data
      const updateData: Partial<UserResume> = {
        show_name: formData.show_name,
        role: formData.role,
        date_of_production: formData.date_of_production,
      };
      
      if (useCompanyDropdown) {
        // Using company dropdown - set both company_id and company_name
        updateData.company_id = formData.company_id || null;
        updateData.company_name = formData.company_name || null;
      } else {
        // Using manual entry - clear company_id, keep company_name
        updateData.company_id = null;
        updateData.company_name = formData.company_name || null;
      }
      
      await onUpdate(entry.resume_entry_id, updateData);
      onCancelEdit();
    } catch (error) {
      console.error('Error saving resume entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resume entry?')) {
      return;
    }
    
    setDeleting(true);
    try {
      await onDelete(entry.resume_entry_id);
    } catch (error) {
      console.error('Error deleting resume entry:', error);
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      company_name: entry.company_name || '',
      company_id: entry.company_id || '',
      show_name: entry.show_name || '',
      role: entry.role || '',
      date_of_production: entry.date_of_production || '',
    });
    setUseCompanyDropdown(!!entry.company_id);
    onCancelEdit();
  };

  const sourceLabel = entry.source;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 neu-card-raised">
      {isEditing ? (  
        <div className="space-y-4 neu-card-raised">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Show/Production Name"
              name="show_name"
              className="neu-input"
              value={formData.show_name}
              onChange={handleInputChange}
              placeholder="Hamlet"
            />

            <FormInput
              label="Role"
              name="role"
              className="neu-input"
              value={formData.role}
              onChange={handleInputChange}
              placeholder="Ophelia"
            />

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
                <FormSelect
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company.company_id} value={company.company_id}>
                      {company.name}
                    </option>
                  ))}
                </FormSelect>
              ) : (
                <FormInput
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="neu-input"
                  placeholder="Shakespeare Theater Company"
                />
              )}
              {useCompanyDropdown && formData.company_id && (
                <p className="text-xs text-neu-text-primary/60 mt-1">
                  ⓘ Company owner will be notified for approval
                </p>
              )}
            </div>

            <FormInput
              label="Date"
              name="date_of_production"
              className="neu-input"
              value={formData.date_of_production}
              onChange={handleInputChange}
              placeholder="2024"
            />
          </div>

          <div className="flex justify-end gap-2 nav-buttons">
            <Button
              onClick={handleCancel}
              disabled={saving || deleting}
              text="Cancel"
            />
            <Button
              onClick={handleSave}
              disabled={saving || deleting}
              text={saving ? 'Saving...' : 'Save'}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-neu-text-primary mb-1">
                  {entry.show_name || 'Untitled Production'}
                </h3>
                {(entry.source === 'application' || entry.company_approved) && (
                  <svg
                    className="w-5 h-5 text-green-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>{entry.company_approved ? 'Approved by company' : 'Verified from application'}</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {entry.company_id && entry.company_approved === null && (
                  <svg
                    className="w-5 h-5 text-yellow-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
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
              <p className="text-neu-accent-primary font-medium">
                {entry.role || 'Role not specified'}
              </p>
            </div>
            {parentIsEditing && (
              <div className="flex gap-2 nav-buttons">
                <Button
                  onClick={onStartEdit}
                  disabled={deleting}
                  text="Edit"
                />
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  text={deleting ? 'Deleting...' : 'Delete'}
                />
              </div>
            )}
          </div>

          <div className="space-y-1 text-sm text-neu-text-primary/80 mb-4">
            {entry.company_name && (
              <p>
                <span className="text-neu-text-primary/60">Company: </span>
                {entry.company_name}
              </p>
            )}
            {entry.date_of_production && (
              <p>
                <span className="text-neu-text-primary/60">Date: </span>
                {entry.date_of_production}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
