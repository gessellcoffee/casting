'use client';

import { useState, useEffect } from 'react';
import { getUserCompanies, createCompany } from '@/lib/supabase/company';
import type { Company } from '@/lib/supabase/types';
import RadioCard from '@/components/ui/forms/RadioCard';
import FormInput from '@/components/ui/forms/FormInput';
import Alert from '@/components/ui/feedback/Alert';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';

interface CompanySelectorProps {
  userId: string;
  selectedCompanyId: string | null;
  isCompanyAudition: boolean;
  onSelect: (companyId: string | null, isCompany: boolean) => void;
  onNext: () => void;
}

export default function CompanySelector({
  userId,
  selectedCompanyId,
  isCompanyAudition,
  onSelect,
  onNext,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [userId]);

  const loadCompanies = async () => {
    setLoading(true);
    const userCompanies = await getUserCompanies(userId);
    setCompanies(userCompanies);
    setLoading(false);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      setError('Company name is required');
      return;
    }

    setCreating(true);
    setError(null);

    const { data, error: createError } = await createCompany({
      name: newCompanyName.trim(),
    });

    if (createError) {
      setError('Failed to create company');
      setCreating(false);
      return;
    }

    if (data) {
      setCompanies([...companies, data]);
      onSelect(data.company_id, true);
      setNewCompanyName('');
      setShowCreateForm(false);
    }

    setCreating(false);
  };

  const handleNext = () => {
    if (isCompanyAudition && !selectedCompanyId) {
      setError('Please select a company');
      return;
    }
    onNext();
  };

  if (loading) {
    return <div className="text-neu-text-primary">Loading companies...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Who is hosting this audition?
        </h2>
        <p className="text-neu-text-primary/70 mb-6">
          Choose whether to post this audition as yourself or under a company.
        </p>
      </div>

      {/* Radio Options */}
      <div className="space-y-4">
        {/* Individual Option */}
        <RadioCard
          name="audition-type"
          value="individual"
          checked={!isCompanyAudition}
          onChange={() => onSelect(null, false)}
          title="Post as Individual"
          description="This audition will be posted under your personal profile"
        />

        {/* Company Option */}
        <RadioCard
          name="audition-type"
          value="company"
          checked={isCompanyAudition}
          onChange={() => onSelect(selectedCompanyId, true)}
          title="Post under Company"
          description="This audition will be posted under a company you manage"
        />
      </div>

      {/* Company Selection (shown when company option is selected) */}
      {isCompanyAudition && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Select a Company</h3>

          {companies.length > 0 ? (
            <div className="space-y-2">
              {companies.map((company) => (
                <RadioCard
                  key={company.company_id}
                  name="company"
                  value={company.company_id}
                  checked={selectedCompanyId === company.company_id}
                  onChange={(value) => onSelect(value, true)}
                  title={company.name}
                  description={company.description || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-neu-text-primary/60 text-sm">
              You don't have any companies yet. Create one below.
            </div>
          )}

          {/* Create New Company */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm font-medium"
            >
              + Create New Company
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
              <FormInput
                label="Company Name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                disabled={creating}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCompany}
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCompanyName('');
                    setError(null);
                  }}
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-neu-surface text-neu-text-primary hover:bg-[#3e4e6e] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Navigation */}
      <WizardNavigation
        onNext={handleNext}
        showBack={false}
      />
    </div>
  );
}
