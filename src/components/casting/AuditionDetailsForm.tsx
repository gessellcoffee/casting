'use client';

import { useState } from 'react';
import type { EquityStatus } from '@/lib/supabase/types';
import DateArrayInput from '@/components/ui/DateArrayInput';
import AddressInput from '@/components/ui/AddressInput';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import Alert from '@/components/ui/feedback/Alert';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';

interface AuditionDetails {
  auditionDates: string[];
  auditionLocation: string;
  rehearsalDates: string[];
  rehearsalLocation: string;
  performanceDates: string[];
  performanceLocation: string;
  ensembleSize: number | null;
  equityStatus: EquityStatus | null;
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
  const [localDetails, setLocalDetails] = useState<AuditionDetails>(details);
  const [error, setError] = useState<string | null>(null);

  const equityStatuses: EquityStatus[] = ['Equity', 'Non-Equity', 'Hybrid'];

  const updateField = (field: keyof AuditionDetails, value: any) => {
    setLocalDetails({ ...localDetails, [field]: value });
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
