'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { updateAudition } from '@/lib/supabase/auditions';
import { deleteAuditionSlots, createAuditionSlots } from '@/lib/supabase/auditionSlots';
import StarryContainer from '@/components/StarryContainer';
import AuditionDetailsForm from '@/components/casting/AuditionDetailsForm';
import SlotScheduler from '@/components/casting/SlotScheduler';

type EditStep = 'details' | 'slots';

export default function EditAuditionPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [audition, setAudition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<EditStep>('details');
  
  const [auditionDetails, setAuditionDetails] = useState({
    auditionDates: [] as string[],
    auditionLocation: '',
    rehearsalDates: [] as string[],
    rehearsalLocation: '',
    performanceDates: [] as string[],
    performanceLocation: '',
    ensembleSize: null as number | null,
    equityStatus: null as 'Equity' | 'Non-Equity' | 'Hybrid' | null,
  });
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await loadAudition(currentUser.id);
    };

    init();
  }, [params.id, router]);

  const loadAudition = async (userId: string) => {
    setLoading(true);
    console.log('Loading audition:', params.id);
    
    const { data, error } = await getAuditionById(params.id as string);
    
    if (error || !data) {
      console.error('Error loading audition:', error);
      alert('Audition not found');
      router.push('/cast');
      return;
    }

    console.log('Loaded audition data:', data);

    // Check authorization
    if (data.user_id !== userId) {
      alert('You can only edit your own auditions');
      router.push('/cast');
      return;
    }

    setAudition(data);
    
    // Parse existing data
    const parsedDetails = {
      auditionDates: data.audition_dates || [],
      auditionLocation: data.audition_location || '',
      rehearsalDates: data.rehearsal_dates 
        ? data.rehearsal_dates.split(',').map((d: string) => d.trim()).filter(Boolean)
        : [],
      rehearsalLocation: data.rehearsal_location || '',
      performanceDates: data.performance_dates 
        ? data.performance_dates.split(',').map((d: string) => d.trim()).filter(Boolean)
        : [],
      performanceLocation: data.performance_location || '',
      ensembleSize: data.ensemble_size,
      equityStatus: data.equity_status,
    };
    
    console.log('Parsed audition details:', parsedDetails);
    console.log('Loaded slots:', data.slots);
    
    setAuditionDetails(parsedDetails);
    setSlots(data.slots || []);
    setLoading(false);
  };

  const handleSave = async (slotsToSave: any[]) => {
    setSaving(true);

    try {
      // Step 1: Update audition details
      const updates = {
        audition_dates: auditionDetails.auditionDates,
        audition_location: auditionDetails.auditionLocation,
        rehearsal_dates: auditionDetails.rehearsalDates.join(', '),
        rehearsal_location: auditionDetails.rehearsalLocation,
        performance_dates: auditionDetails.performanceDates.join(', '),
        performance_location: auditionDetails.performanceLocation,
        ensemble_size: auditionDetails.ensembleSize,
        equity_status: auditionDetails.equityStatus,
      };

      console.log('Saving audition with updates:', updates);
      console.log('Saving slots:', slotsToSave);

      const { data: updatedAudition, error: auditionError } = await updateAudition(params.id as string, updates);

      if (auditionError) {
        console.error('Audition update error:', auditionError);
        throw new Error('Failed to update audition details: ' + auditionError.message);
      }

      console.log('Audition updated successfully:', updatedAudition);

      // Step 2: Update slots - delete all existing slots and recreate them
      console.log('Deleting existing slots...');
      const { error: deleteError } = await deleteAuditionSlots(params.id as string);

      if (deleteError) {
        console.error('Delete slots error:', deleteError);
        throw new Error('Failed to delete existing slots: ' + deleteError.message);
      }

      console.log('Slots deleted successfully');

      // Step 3: Create new slots if any exist
      if (slotsToSave.length > 0) {
        const slotsData = slotsToSave.map((slot: any) => ({
          audition_id: params.id as string,
          start_time: slot.start_time,
          end_time: slot.end_time,
          location: slot.location || null,
          max_signups: slot.max_signups,
        }));

        console.log('Creating new slots:', slotsData);

        const { data: createdSlots, error: slotsError } = await createAuditionSlots(slotsData);

        if (slotsError) {
          console.error('Create slots error:', slotsError);
          throw new Error('Failed to create new slots: ' + slotsError.message);
        }

        console.log('Slots created successfully:', createdSlots);
      } else {
        console.log('No slots to create');
      }

      console.log('All changes saved successfully!');
      
      // Success - redirect to dashboard
      router.push('/cast');
    } catch (err: any) {
      console.error('Error saving audition:', err);
      alert(err.message || 'Failed to update audition');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[#c5ddff]">Loading audition...</div>
        </div>
      </StarryContainer>
    );
  }

  const steps: { key: EditStep; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'slots', label: 'Slots' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <StarryContainer starCount={10} className="card p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/cast')}
              className="text-[#5a8ff5] hover:text-[#94b0f6] transition-colors mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              Edit Audition
            </h1>
            <p className="text-[#c5ddff]/90 mt-2">
              {audition?.show?.title || 'Update your audition details'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => setCurrentStep(step.key)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        index <= currentStepIndex
                          ? 'bg-[#5a8ff5] border-[#5a8ff5] text-white'
                          : 'bg-[#2e3e5e] border-[#4a7bd9]/20 text-[#c5ddff]/50'
                      }`}
                    >
                      {index + 1}
                    </button>
                    <span
                      className={`text-xs mt-2 ${
                        index <= currentStepIndex ? 'text-[#5a8ff5]' : 'text-[#c5ddff]/50'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        index < currentStepIndex ? 'bg-[#5a8ff5]' : 'bg-[#4a7bd9]/20'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 'details' && (
              <AuditionDetailsForm
                details={auditionDetails}
                onUpdate={(details) => {
                  // Check if audition dates changed
                  const datesChanged = JSON.stringify(details.auditionDates.sort()) !== JSON.stringify(auditionDetails.auditionDates.sort());
                  
                  setAuditionDetails(details);
                  
                  // Clear slots if audition dates changed
                  if (datesChanged) {
                    console.log('Audition dates changed - clearing existing slots');
                    setSlots([]);
                  }
                }}
                onNext={() => setCurrentStep('slots')}
                onBack={() => router.push('/cast')}
              />
            )}

            {currentStep === 'slots' && (
              <SlotScheduler
                slots={slots}
                auditionDates={auditionDetails.auditionDates}
                onUpdate={(updatedSlots) => {
                  setSlots(updatedSlots);
                }}
                onNext={(updatedSlots) => handleSave(updatedSlots)}
                onBack={() => setCurrentStep('details')}
              />
            )}
          </div>

          {/* Save Button */}
          {currentStep === 'slots' && (
            <div className="flex justify-end gap-4">
              <button
                onClick={() => router.push('/cast')}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(slots)}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </StarryContainer>
      </div>
    </div>
  );
}
