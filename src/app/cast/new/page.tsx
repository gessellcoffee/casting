'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase';
import StarryContainer from '@/components/StarryContainer';

// Step components (will create these next)
import CompanySelector from '@/components/casting/CompanySelector';
import ShowSelector from '@/components/casting/ShowSelector';
import RoleManager from '@/components/casting/RoleManager';
import AuditionDetailsForm from '@/components/casting/AuditionDetailsForm';
import SlotScheduler from '@/components/casting/SlotScheduler';
import ReviewAndSubmit from '@/components/casting/ReviewAndSubmit';

type CastingStep = 'company' | 'show' | 'roles' | 'details' | 'slots' | 'review';

interface ProductionTeamMember {
  userId?: string;
  email?: string;
  roleTitle: string;
  firstName?: string;
  lastName?: string;
}

interface CastingData {
  companyId: string | null;
  isCompanyAudition: boolean;
  showId: string | null;
  showData: any | null;
  roles: any[];
  roleOperations: any[];
  auditionDetails: {
    auditionDates: string[];
    auditionLocation: string;
    auditionDetails: string;
    rehearsalDates: string[];
    rehearsalLocation: string;
    performanceDates: string[];
    performanceLocation: string;
    ensembleSize: number | null;
    equityStatus: 'Equity' | 'Non-Equity' | 'Hybrid' | null;
    isPaid: boolean;
    payRange: string;
    payComments: string;
    productionTeam?: ProductionTeamMember[];
    workflowStatus: 'auditioning' | 'casting' | 'offering_roles' | 'rehearsing' | 'performing' | 'completed';
    virtualAuditionsEnabled: boolean;
    virtualAuditionInstructions: string;
  };
  slots: any[];
}

export default function NewCastingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<CastingStep>('company');
  const [castingData, setCastingData] = useState<CastingData>({
    companyId: null,
    isCompanyAudition: false,
    showId: null,
    showData: null,
    roles: [],
    roleOperations: [],
    auditionDetails: {
      auditionDates: [],
      auditionLocation: '',
      auditionDetails: '',
      rehearsalDates: [],
      rehearsalLocation: '',
      performanceDates: [],
      performanceLocation: '',
      ensembleSize: null,
      equityStatus: null,
      isPaid: false,
      payRange: '',
      payComments: '',
      productionTeam: [],
      workflowStatus: 'auditioning',
      virtualAuditionsEnabled: false,
      virtualAuditionInstructions: '',
    },
    slots: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Determine if slots step should be included based on workflow status
  // Only 'auditioning' status requires audition slots
  const needsAuditionSlots = castingData.auditionDetails.workflowStatus === 'auditioning';

  const allSteps: { key: CastingStep; label: string }[] = [
    { key: 'company', label: 'Company' },
    { key: 'show', label: 'Show' },
    { key: 'roles', label: 'Roles' },
    { key: 'details', label: 'Details' },
    { key: 'slots', label: 'Slots' },
    { key: 'review', label: 'Review' },
  ];

  // Filter out slots step if not needed
  const steps = needsAuditionSlots ? allSteps : allSteps.filter(s => s.key !== 'slots');

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleNext = () => {
    // Note: Details step handles its own navigation to account for workflow status
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    // Determine previous step based on current step and workflow status
    if (currentStep === 'review') {
      // Going back from review, check if we have slots
      const needsSlots = castingData.auditionDetails.workflowStatus === 'auditioning';
      setCurrentStep(needsSlots ? 'slots' : 'details');
    } else {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        setCurrentStep(steps[prevIndex].key);
      }
    }
  };

  const updateCastingData = (updates: Partial<CastingData>) => {
    setCastingData((prev) => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neu-text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <StarryContainer starCount={10} className="card p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              Create a Production
            </h1>
            <p className="text-neu-text-primary/90 mt-2">
              Set up a new production for your show
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        index <= currentStepIndex
                          ? 'bg-[#5a8ff5] border-[#5a8ff5] text-white'
                          : 'bg-neu-surface border-neu-border text-neu-text-primary/50'
                      }`}
                    >
                      {index + 1}
                    </div>
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
            {currentStep === 'company' && (
              <CompanySelector
                userId={user.id}
                selectedCompanyId={castingData.companyId}
                isCompanyAudition={castingData.isCompanyAudition}
                onSelect={(companyId, isCompany) => {
                  updateCastingData({ companyId, isCompanyAudition: isCompany });
                }}
                onNext={handleNext}
              />
            )}

            {currentStep === 'show' && (
              <ShowSelector
                userId={user.id}
                companyId={castingData.companyId}
                selectedShowId={castingData.showId}
                onSelect={(showId, showData) => {
                  updateCastingData({ showId, showData });
                }}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 'roles' && (
              <RoleManager
                showId={castingData.showId!}
                roles={castingData.roles}
                onUpdate={(operations) => {
                  // Store the operations for later processing
                  updateCastingData({ roleOperations: operations });

                  // Also update the roles array to reflect current state for display
                  const updatedRoles = [...castingData.roles];

                  operations.forEach(operation => {
                    switch (operation.type) {
                      case 'create':
                        if (operation.role) {
                          updatedRoles.push({
                            role_name: operation.role.role_name,
                            description: operation.role.description,
                            role_type: operation.role.role_type,
                            gender: operation.role.gender,
                            needs_understudy: operation.role.needs_understudy,
                          });
                        }
                        break;
                      case 'update':
                        if (operation.roleId && operation.role) {
                          const index = updatedRoles.findIndex(r => r.role_id === operation.roleId);
                          if (index >= 0) {
                            updatedRoles[index] = {
                              ...updatedRoles[index],
                              ...operation.role,
                            };
                          }
                        }
                        break;
                      case 'delete':
                        if (operation.roleId) {
                          const index = updatedRoles.findIndex(r => r.role_id === operation.roleId);
                          if (index >= 0) {
                            updatedRoles.splice(index, 1);
                          }
                        }
                        break;
                    }
                  });

                  updateCastingData({ roles: updatedRoles });
                }}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 'details' && (
              <AuditionDetailsForm
                details={castingData.auditionDetails}
                onUpdate={(details) => {
                  updateCastingData({ auditionDetails: details });
                }}
                onNext={(details) => {
                  // Update state with fresh details
                  updateCastingData({ auditionDetails: details });
                  // Use the fresh details to determine next step
                  const needsSlots = details.workflowStatus === 'auditioning';
                  setCurrentStep(needsSlots ? 'slots' : 'review');
                }}
                onBack={handleBack}
              />
            )}

            {currentStep === 'slots' && (
              <SlotScheduler
                slots={castingData.slots}
                auditionDates={castingData.auditionDetails.auditionDates}
                onUpdate={(slots) => {
                  updateCastingData({ slots });
                }}
                onNext={(slots) => {
                  updateCastingData({ slots });
                  handleNext();
                }}
                onBack={handleBack}
              />
            )}

            {currentStep === 'review' && (
              <ReviewAndSubmit
                castingData={castingData}
                userId={user.id}
                onBack={handleBack}
                onSuccess={() => {
                  router.push('/cast');
                }}
              />
            )}
          </div>
        </StarryContainer>
      </div>
    </div>
  );
}
