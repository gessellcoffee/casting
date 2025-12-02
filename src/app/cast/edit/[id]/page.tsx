'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { updateAudition } from '@/lib/supabase/auditions';
import { deleteAuditionSlots, createAuditionSlots } from '@/lib/supabase/auditionSlots';
import { createAuditionRole, updateAuditionRole, deleteAuditionRole } from '@/lib/supabase/auditionRoles';
import { WorkflowStatus } from '@/lib/supabase/workflowStatus';
import StarryContainer from '@/components/StarryContainer';
import AuditionDetailsForm from '@/components/casting/AuditionDetailsForm';
import SlotScheduler from '@/components/casting/SlotScheduler';
import RoleManager from '@/components/casting/RoleManager';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

type EditStep = 'details' | 'roles' | 'slots';

interface RoleOperation {
  type: 'create' | 'update' | 'delete';
  role?: any;
  roleId?: string;
}

export default function EditAuditionPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [audition, setAudition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<EditStep>('details');
  const [roleOperations, setRoleOperations] = useState<RoleOperation[]>([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });
  
  const [auditionDetails, setAuditionDetails] = useState({
    auditionDates: [] as string[],
    auditionLocation: '',
    auditionDetails: '',
    rehearsalDates: [] as string[],
    rehearsalLocation: '',
    performanceDates: [] as string[],
    performanceLocation: '',
    ensembleSize: null as number | null,
    equityStatus: null as 'Equity' | 'Non-Equity' | 'Hybrid' | null,
    isPaid: false,
    payRange: '',
    payComments: '',
    workflowStatus: 'auditioning' as WorkflowStatus,
    virtualAuditionsEnabled: false,
    virtualAuditionInstructions: '',
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

  const openModal = (title: string, message: string, onConfirmAction?: () => void, confirmText?: string, showCancelBtn: boolean = true) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirmAction) onConfirmAction();
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      confirmButtonText: confirmText || 'Confirm',
      showCancel: showCancelBtn
    });
  };

  const loadAudition = async (userId: string) => {
    setLoading(true);
    
    const { data, error } = await getAuditionById(params.id as string);
    
    if (error || !data) {
      console.error('Error loading audition:', error);
      openModal('Error', 'Audition not found. Redirecting to dashboard.', () => router.push('/cast'), 'OK', false);
      return;
    }

    // Check authorization
    if (data.user_id !== userId) {
      openModal('Unauthorized', 'You can only edit your own auditions. Redirecting to dashboard.', () => router.push('/cast'), 'OK', false);
      return;
    }

    setAudition(data);
    
    console.log('Loaded audition data:', data);
    console.log('Audition slots from database:', data.slots);
    console.log('Number of slots:', data.slots?.length || 0);
    
    // Parse existing data
    const parsedDetails = {
      auditionDates: (data.audition_dates as string[]) || [],
      auditionLocation: data.audition_location || '',
      auditionDetails: data.audition_details || '',
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
      isPaid: data.is_paid || false,
      payRange: data.pay_range || '',
      payComments: data.pay_comments || '',
      workflowStatus: (data.workflow_status || 'auditioning') as WorkflowStatus,
      virtualAuditionsEnabled: data.virtual_auditions_enabled || false,
      virtualAuditionInstructions: data.virtual_audition_instructions || '',
    };
    
    setAuditionDetails(parsedDetails);
    setSlots(data.slots || []);
    console.log('Set slots state to:', data.slots || []);
    setLoading(false);
  };

  const handleSave = async (slotsToSave: any[]) => {
    setSaving(true);

    try {
      // Step 1: Update audition details
      const updates = {
        audition_dates: auditionDetails.auditionDates,
        audition_location: auditionDetails.auditionLocation,
        audition_details: auditionDetails.auditionDetails,
        rehearsal_dates: auditionDetails.rehearsalDates.join(', '),
        rehearsal_location: auditionDetails.rehearsalLocation,
        performance_dates: auditionDetails.performanceDates.join(', '),
        performance_location: auditionDetails.performanceLocation,
        ensemble_size: auditionDetails.ensembleSize,
        equity_status: auditionDetails.equityStatus,
        is_paid: auditionDetails.isPaid,
        pay_range: auditionDetails.payRange,
        pay_comments: auditionDetails.payComments,
        workflow_status: auditionDetails.workflowStatus,
        virtual_auditions_enabled: auditionDetails.virtualAuditionsEnabled,
        virtual_audition_instructions: auditionDetails.virtualAuditionInstructions,
      };

      const { data: updatedAudition, error: auditionError } = await updateAudition(params.id as string, updates);

      if (auditionError) {
        console.error('Audition update error:', auditionError);
        throw new Error('Failed to update audition details: ' + auditionError.message);
      }

      // Step 2: Process audition role operations (create/update/delete)
      if (roleOperations.length > 0) {
        for (const operation of roleOperations) {
          switch (operation.type) {
            case 'create':
              if (operation.role) {
                const roleData = {
                  ...operation.role,
                  audition_id: params.id as string,
                };
                const { error: createError } = await createAuditionRole(roleData);
                if (createError) {
                  throw new Error('Failed to create audition role: ' + createError.message);
                }
              }
              break;

            case 'update':
              if (operation.roleId && operation.role) {
                const { error: updateError } = await updateAuditionRole(operation.roleId, operation.role);
                if (updateError) {
                  throw new Error('Failed to update audition role: ' + updateError.message);
                }
              }
              break;

            case 'delete':
              if (operation.roleId) {
                const { error: deleteError } = await deleteAuditionRole(operation.roleId);
                if (deleteError) {
                  throw new Error('Failed to delete audition role: ' + deleteError.message);
                }
              }
              break;
          }
        }
      }

      // Step 3: Update slots - delete all existing slots and recreate them
      const { error: deleteError } = await deleteAuditionSlots(params.id as string);

      if (deleteError) {
        console.error('Delete slots error:', deleteError);
        throw new Error('Failed to delete existing slots: ' + deleteError.message);
      }

      // Step 4: Create new slots if any exist
      if (slotsToSave.length > 0) {
        const slotsData = slotsToSave.map((slot: any) => {
          // Extract date from start_time (ISO string)
          const date = new Date(slot.start_time).toISOString().split('T')[0];
          
          return {
            audition_id: params.id as string,
            date: date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            max_signups: slot.max_signups,
          };
        });

        const { data: createdSlots, error: slotsError } = await createAuditionSlots(slotsData);

        if (slotsError) {
          console.error('Create slots error:', slotsError);
          throw new Error('Failed to create new slots: ' + slotsError.message);
        }
      }
      
      // Success - redirect to dashboard
      router.push('/cast');
    } catch (err: any) {
      console.error('Error saving audition:', err);
      openModal('Save Failed', err.message || 'Failed to update audition. Please try again.', undefined, 'OK', false);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary">Loading audition...</div>
        </div>
      </StarryContainer>
    );
  }

  const steps: { key: EditStep; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'roles', label: 'Roles' },
    { key: 'slots', label: 'Slots' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen px-4 py-8">
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmButtonText={modalConfig.confirmButtonText}
        showCancel={modalConfig.showCancel}
      />
      <div className="max-w-4xl mx-auto">
        <StarryContainer starCount={10} className="card p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/cast')}
              className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              Edit Audition
            </h1>
            <p className="text-neu-text-primary/90 mt-2">
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
                          : 'bg-neu-surface border-neu-border text-neu-text-primary/50'
                      }`}
                    >
                      {index + 1}
                    </button>
                    <span
                      className={`text-xs mt-2 ${
                        index <= currentStepIndex ? 'text-neu-accent-primary' : 'text-neu-text-primary/50'
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
                    setSlots([]);
                  }
                }}
                onNext={() => setCurrentStep('roles')}
                onBack={() => router.push('/cast')}
              />
            )}

            {currentStep === 'roles' && audition && (
              <RoleManager
                showId={audition.show_id || audition.show?.show_id}
                auditionId={audition.audition_id}
                roles={audition.roles || []}
                onUpdate={(operations) => {
                  setRoleOperations(operations);
                }}
                onNext={() => setCurrentStep('slots')}
                onBack={() => setCurrentStep('details')}
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
            <div className="flex justify-end gap-4 bg-neu-surface opacity-0">
              <button
                onClick={() => router.push('/cast')}
                className="px-6 py-3 rounded-xl bg-neu-surface opacity-0 border border-neu-border text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(slots)}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
