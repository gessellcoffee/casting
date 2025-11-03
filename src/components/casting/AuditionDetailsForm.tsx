'use client';

import { useState, useEffect } from 'react';
import type { EquityStatus } from '@/lib/supabase/types';
import DateArrayInput from '@/components/ui/DateArrayInput';
import AddressInput from '@/components/ui/AddressInput';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import Alert from '@/components/ui/feedback/Alert';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';
import { searchUsersForProductionTeam } from '@/lib/supabase/productionTeamMembers';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { X } from 'lucide-react';

interface ProductionTeamMember {
  userId?: string;
  email?: string;
  roleTitle: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface AuditionDetails {
  auditionDates: string[];
  auditionLocation: string;
  rehearsalDates: string[];
  rehearsalLocation: string;
  performanceDates: string[];
  performanceLocation: string;
  ensembleSize: number | null;
  equityStatus: EquityStatus | null;
  productionTeam?: ProductionTeamMember[];
}

interface AuditionDetailsFormProps {
  details: AuditionDetails;
  onUpdate: (details: AuditionDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AuditionDetailsForm({
  details,
  onUpdate,
  onNext,
  onBack,
}: AuditionDetailsFormProps) {
  const [localDetails, setLocalDetails] = useState<AuditionDetails>({
    ...details,
    productionTeam: details.productionTeam || [],
  });
  const [error, setError] = useState<string | null>(null);
  
  // Production team state
  const [roleTitle, setRoleTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const equityStatuses: EquityStatus[] = ['Equity', 'Non-Equity', 'Hybrid'];

  // Search for users when query changes
  useEffect(() => {
    const handleSearch = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        setSearching(true);
        const results = await searchUsersForProductionTeam(debouncedSearchQuery);
        
        // Filter out users already in production team
        const existingUserIds = (localDetails.productionTeam || [])
          .map(m => m.userId)
          .filter(Boolean);
        const filteredResults = results.filter(user => !existingUserIds.includes(user.id));
        
        setSearchResults(filteredResults);
        setSearching(false);
      } else {
        setSearchResults([]);
      }
    };

    handleSearch();
  }, [debouncedSearchQuery, localDetails.productionTeam]);

  const updateField = (field: keyof AuditionDetails, value: any) => {
    setLocalDetails({ ...localDetails, [field]: value });
  };

  const handleAddMember = (userId: string, username: string, firstName?: string, lastName?: string) => {
    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }

    const newMember: ProductionTeamMember = {
      userId,
      roleTitle: roleTitle.trim(),
      username,
      firstName,
      lastName,
    };

    setLocalDetails({
      ...localDetails,
      productionTeam: [...(localDetails.productionTeam || []), newMember],
    });

    setRoleTitle('');
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleInviteByEmail = () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    const newMember: ProductionTeamMember = {
      email: inviteEmail.trim(),
      roleTitle: roleTitle.trim(),
    };

    setLocalDetails({
      ...localDetails,
      productionTeam: [...(localDetails.productionTeam || []), newMember],
    });

    setInviteEmail('');
    setRoleTitle('');
    setShowInviteForm(false);
    setError(null);
  };

  const handleRemoveMember = (index: number) => {
    const updatedTeam = (localDetails.productionTeam || []).filter((_, i) => i !== index);
    setLocalDetails({
      ...localDetails,
      productionTeam: updatedTeam,
    });
  };

  const handleNext = () => {
    // Optional validation - all fields are optional
    onUpdate(localDetails);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Audition Details
        </h2>
        <p className="text-neu-text-primary/70 mb-6">
          Provide additional information about auditions, rehearsals, performances, and production details.
        </p>
      </div>

      <div className="space-y-4">
        {/* Audition Information */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Audition Information</h3>
          
          <DateArrayInput
            label="Audition Dates"
            value={localDetails.auditionDates}
            onChange={(dates) => updateField('auditionDates', dates)}
            placeholder="Select audition dates..."
          />

          <AddressInput
            label="Audition Location"
            value={localDetails.auditionLocation}
            onChange={(value) => updateField('auditionLocation', value)}
            placeholder="e.g., Main Theater, 123 Broadway"
          />
        </div>

        {/* Rehearsal Information */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Rehearsal Information</h3>
          
          <DateArrayInput
            label="Rehearsal Dates"
            value={localDetails.rehearsalDates}
            onChange={(dates) => updateField('rehearsalDates', dates)}
            placeholder="Select rehearsal dates..."
          />

          <AddressInput
            label="Rehearsal Location"
            value={localDetails.rehearsalLocation}
            onChange={(value) => updateField('rehearsalLocation', value)}
            placeholder="e.g., Studio Theater, 123 Main St"
          />
        </div>

        {/* Performance Information */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Performance Information</h3>
          
          <DateArrayInput
            label="Performance Dates"
            value={localDetails.performanceDates}
            onChange={(dates) => updateField('performanceDates', dates)}
            placeholder="Select performance dates..."
          />

          <AddressInput
            label="Performance Location"
            value={localDetails.performanceLocation}
            onChange={(value) => updateField('performanceLocation', value)}
            placeholder="e.g., Main Stage Theater"
          />
        </div>

        {/* Production Details */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Production Details</h3>
          <p>Ensemble is the number of non-principle actors needed. You may cast less or more than this number, but setting a target will be good for Actors expectations of casting.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Ensemble Size"
              type="number"
              value={localDetails.ensembleSize || ''}
              onChange={(e) =>
                updateField('ensembleSize', e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="e.g., 10"
              min="0"
            />

            <FormSelect
              label="Equity Status"
              value={localDetails.equityStatus || ''}
              onChange={(e) =>
                updateField('equityStatus', e.target.value || null)
              }
            >
              <option value="">Select status...</option>
              {equityStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        {/* Production Team */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Production Team</h3>
          <p className="text-neu-text-primary/70 text-sm">
            Add production team members with custom role titles (e.g., Director, Stage Manager, Choreographer).
          </p>

          {/* Role Title Input */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-1">
              Role Title
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g., Director, Stage Manager, Choreographer"
              className="neu-input w-full"
            />
          </div>

          {/* Search for existing user */}
          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-1">
              Search for User
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or name..."
                className="neu-input w-full"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-neu-accent-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neu-surface/50 border border-neu-border hover:border-neu-accent-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center">
                        <span className="text-neu-accent-primary font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-neu-text-primary font-medium">@{user.username}</p>
                      {(user.first_name || user.last_name) && (
                        <p className="text-neu-text-primary/60 text-sm">
                          {user.first_name} {user.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddMember(user.id, user.username, user.first_name, user.last_name)}
                    disabled={!roleTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-neu-accent-primary text-white hover:bg-neu-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Invite by Email */}
          <div className="pt-3 border-t border-neu-border">
            <button
              type="button"
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm font-medium"
            >
              {showInviteForm ? '− Hide Email Invitation' : '+ Invite by Email'}
            </button>

            {showInviteForm && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neu-text-primary mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="neu-input w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleInviteByEmail}
                  disabled={!roleTitle.trim() || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-neu-accent-primary text-white hover:bg-neu-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Invitation
                </button>
              </div>
            )}
          </div>

          {/* Current Team Members */}
          {localDetails.productionTeam && localDetails.productionTeam.length > 0 && (
            <div className="pt-3 border-t border-neu-border">
              <h4 className="text-sm font-medium text-neu-text-primary mb-2">
                Team Members ({localDetails.productionTeam.length})
              </h4>
              <div className="space-y-2">
                {localDetails.productionTeam.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-neu-surface/50 border border-neu-border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {member.userId ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center">
                            <span className="text-neu-accent-primary font-medium">
                              {member.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-neu-text-primary font-medium">
                              @{member.username}
                            </p>
                            {(member.firstName || member.lastName) && (
                              <p className="text-neu-text-primary/60 text-sm">
                                {member.firstName} {member.lastName}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <span className="text-yellow-400 font-medium">?</span>
                          </div>
                          <div>
                            <p className="text-neu-text-primary font-medium">{member.email}</p>
                            <p className="text-neu-text-primary/60 text-sm">Invitation pending</p>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="px-3 py-1 rounded-xl border-2 border-blue-400/60 text-sm font-medium text-neu-text-primary">
                          {member.roleTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Remove member"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={handleNext}
      />
    </div>
  );
}
