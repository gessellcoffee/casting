'use client';

import { useState, useEffect } from 'react';
import type { EquityStatus } from '@/lib/supabase/types';
import type { WorkflowStatus } from '@/lib/supabase/workflowStatus';
import DateArrayInput from '@/components/ui/DateArrayInput';
import AddressInput from '@/components/ui/AddressInput';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import Alert from '@/components/ui/feedback/Alert';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';
import { searchUsersForProductionTeam } from '@/lib/supabase/productionTeamMembers';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { X } from 'lucide-react';
import Link from 'next/link';

interface ProductionTeamMember {
  userId?: string;
  email?: string;
  roleTitle: string;
  firstName?: string;
  lastName?: string;
}

interface AuditionDetails {
  auditionDates: string[];
  auditionLocation: string;
  auditionDetails: string;
  rehearsalDates: string[];
  rehearsalLocation: string;
  performanceDates: string[];
  performanceLocation: string;
  ensembleSize: number | null;
  equityStatus: EquityStatus | null;
  isPaid: boolean;
  payRange: string;
  payComments: string;
  productionTeam?: ProductionTeamMember[];
  workflowStatus: WorkflowStatus;
  virtualAuditionsEnabled: boolean;
  virtualAuditionInstructions: string;
  showCastPublicly: boolean;
  requiredSignupForms: string[];
  requiredCallbackForms: string[];
}

interface AuditionDetailsFormProps {
  details: AuditionDetails;
  onUpdate: (details: AuditionDetails) => void;
  onNext: (details: AuditionDetails) => void;
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
  const workflowStatuses: { value: WorkflowStatus; label: string; description: string }[] = [
    { value: 'auditioning', label: 'Auditioning', description: 'Currently holding auditions' },
    { value: 'casting', label: 'Casting', description: 'Reviewing auditions and making casting decisions' },
    { value: 'offering_roles', label: 'Offering Roles', description: 'Sending casting offers to actors' },
    { value: 'rehearsing', label: 'Rehearsing', description: 'In rehearsal with cast' },
    { value: 'performing', label: 'Performing', description: 'Currently running performances' },
    { value: 'completed', label: 'Completed', description: 'Production has finished' },
  ];

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

  const handleAddMember = (userId: string, email: string, firstName?: string, lastName?: string) => {
    if (!roleTitle.trim()) {
      setError('Please enter a role title');
      return;
    }

    const newMember: ProductionTeamMember = {
      userId,
      roleTitle: roleTitle.trim(),
      email,
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
    // Validate pay range if audition is marked as paid
    if (localDetails.isPaid && !localDetails.payRange.trim()) {
      setError('Pay range is required for paid auditions');
      return;
    }
    
    setError(null);
    onUpdate(localDetails);
    onNext(localDetails);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Production Details
        </h2>
        <p className="text-neu-text-primary/70 mb-6">
          Provide information about your production's current status, auditions, rehearsals, and performances.
        </p>
      </div>

      <div className="space-y-4">
        {/* Production Status */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Production Status</h3>
          <p className="text-sm text-neu-text-primary/70">
            Select the current stage of your production. This determines which features are available.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workflowStatuses.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => updateField('workflowStatus', status.value)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  localDetails.workflowStatus === status.value
                    ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary bg-neu-accent-primary/5'
                    : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border hover:border-neu-accent-primary/50'
                }`}
                style={{ backgroundColor: localDetails.workflowStatus === status.value ? undefined : 'var(--neu-surface)' }}
              >
                <div className="font-semibold text-neu-text-primary">{status.label}</div>
                <div className="text-xs text-neu-text-secondary mt-1">{status.description}</div>
              </button>
            ))}
          </div>
          
          {localDetails.workflowStatus !== 'auditioning' && (
            <Alert variant="info" className="mt-3">
              Audition slots are not required for productions in {localDetails.workflowStatus} status.
            </Alert>
          )}

          {/* Show Cast Publicly Toggle */}
          <div className="mt-4 pt-4 border-t border-neu-border">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="showCastPublicly"
                checked={localDetails.showCastPublicly}
                onChange={(e) => updateField('showCastPublicly', e.target.checked)}
                className="mt-1 w-4 h-4 text-neu-accent-primary bg-neu-surface border-neu-border rounded focus:ring-2 focus:ring-neu-accent-primary/50"
              />
              <div>
                <label htmlFor="showCastPublicly" className="block text-sm font-medium text-neu-text-primary cursor-pointer">
                  Publish cast list on audition page
                </label>
                <p className="text-xs text-neu-text-primary/70 mt-1">
                  When enabled, the cast list will be visible to everyone visiting the audition page. 
                  When disabled, only you and your production team can see the cast list.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Audition Information - Only shown for auditioning status */}
        {localDetails.workflowStatus === 'auditioning' && (
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

          <div>
            <label className="block text-sm font-medium text-neu-text-primary mb-1">
              Audition Details & Instructions
            </label>
            <textarea
              value={localDetails.auditionDetails}
              onChange={(e) => updateField('auditionDetails', e.target.value)}
              placeholder="Add any additional details or instructions for actors (e.g., what to prepare, materials to bring, dress code, special requirements)..."
              rows={4}
              className="neu-input w-full resize-y"
            />
            <p className="text-sm text-neu-text-primary/60 mt-1">
              Optional: Provide helpful information to guide actors preparing for the audition
            </p>
          </div>

          {/* Virtual Auditions Section */}
          <div className="mt-4 p-4 rounded-lg bg-neu-accent-primary/5 border border-neu-accent-primary/20 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="virtualAuditionsEnabled"
                checked={localDetails.virtualAuditionsEnabled}
                onChange={(e) => updateField('virtualAuditionsEnabled', e.target.checked)}
                className="w-4 h-4 text-neu-accent-primary bg-neu-surface border-neu-border rounded focus:ring-2 focus:ring-neu-accent-primary/50"
              />
              <label htmlFor="virtualAuditionsEnabled" className="text-sm font-medium text-neu-text-primary cursor-pointer">
                Accept Virtual Auditions
              </label>
            </div>
            
            <p className="text-xs text-neu-text-secondary">
              Allow actors to submit video auditions instead of attending in-person time slots
            </p>

            {localDetails.virtualAuditionsEnabled && (
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-1">
                  Virtual Audition Instructions
                </label>
                <textarea
                  value={localDetails.virtualAuditionInstructions}
                  onChange={(e) => updateField('virtualAuditionInstructions', e.target.value)}
                  placeholder="Provide specific instructions for virtual submissions (e.g., what scenes to perform, video requirements, file format preferences)..."
                  rows={3}
                  className="neu-input w-full resize-y text-sm"
                />
                <p className="text-xs text-neu-text-secondary mt-1">
                  These instructions will be displayed to actors when they submit virtual auditions
                </p>
              </div>
            )}
          </div>
        </div>
        )}

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
          <p className="text-neu-text-primary/70 text-sm">Ensemble is the number of non-principle actors needed. You may cast less or more than this number, but setting a target will be good for Actors expectations of casting.</p>
          
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

        {/* Compensation Information */}
        <div className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4">
          <h3 className="text-lg font-medium text-neu-text-primary">Compensation</h3>
          
          <FormSelect
            label="Paid Production"
            value={localDetails.isPaid ? 'paid' : 'not-paid'}
            onChange={(e) => updateField('isPaid', e.target.value === 'paid')}
          >
            <option value="not-paid">Not Paid</option>
            <option value="paid">Paid</option>
          </FormSelect>

          {localDetails.isPaid && (
            <>
              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-1">
                  Pay Range <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localDetails.payRange}
                  onChange={(e) => updateField('payRange', e.target.value)}
                  placeholder="e.g., $500-$1000 per week, $20/hour, Stipend: $300"
                  className="neu-input w-full"
                  required
                />
                <p className="text-sm text-neu-text-primary/60 mt-1">
                  Required: Specify the compensation range or amount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neu-text-primary mb-1">
                  Pay Comments
                </label>
                <textarea
                  value={localDetails.payComments}
                  onChange={(e) => updateField('payComments', e.target.value)}
                  placeholder="Add any additional details about compensation (e.g., performance bonuses, travel stipend, meal provided)..."
                  rows={3}
                  className="neu-input w-full resize-y"
                />
                <p className="text-sm text-neu-text-primary/60 mt-1">
                  Optional: Provide additional context or details about compensation
                </p>
              </div>
            </>
          )}
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
                placeholder="Search by email or name..."
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
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-neu-surface/50 border border-neu-border hover:border-neu-accent-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.email}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-neu-accent-primary font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-neu-text-primary font-medium truncate">@{user.email}</p>
                      {(user.first_name || user.last_name) && (
                        <p className="text-neu-text-primary/60 text-sm truncate">
                          {user.first_name} {user.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddMember(user.id, user.email, user.first_name, user.last_name)}
                    disabled={!roleTitle.trim()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neu-accent-primary text-neu-text-primary hover:bg-neu-accent-secondary hover:text-neu-text-primary hover:font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
                  className="px-4 py-2 rounded-xl bg-neu-accent-primary text-neu-text-primary hover:bg-neu-accent-primary hover:font-bold hover:text-neu-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-neu-surface/50 border border-neu-border"
                  >
                    {member.userId ? (
                      <Link 
                        href={`/profile/${member.userId}`}
                        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-neu-accent-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-neu-accent-primary font-medium">
                            {member.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-neu-text-primary font-medium truncate">
                            @{member.email}
                          </p>
                          {(member.firstName || member.lastName) && (
                            <p className="text-neu-text-primary/60 text-sm truncate">
                              {member.firstName} {member.lastName}
                            </p>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-400 font-medium">?</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-neu-text-primary font-medium truncate">{member.email}</p>
                          <p className="text-neu-text-primary/60 text-sm">Invitation pending</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 rounded-xl border-2 border-blue-400/60 text-sm font-medium text-neu-text-primary whitespace-nowrap">
                        {member.roleTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                        title="Remove member"
                      >
                        <X size={18} />
                      </button>
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
