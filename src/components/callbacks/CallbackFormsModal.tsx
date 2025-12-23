'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { getMyAuditionSignupFormAssignments, getIncompleteRequiredCallbackForms } from '@/lib/supabase/customForms';

interface CallbackFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormsCompleted: () => void;
  auditionId: string;
  callbackDetails?: {
    showTitle?: string;
    date?: string;
    time?: string;
    location?: string;
  };
}

export default function CallbackFormsModal({
  isOpen,
  onClose,
  onFormsCompleted,
  auditionId,
  callbackDetails,
}: CallbackFormsModalProps) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [incompleteFormIds, setIncompleteFormIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && auditionId) {
      loadFormAssignments();
    }
  }, [isOpen, auditionId]);

  const loadFormAssignments = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading callback forms for audition:', auditionId);
      
      // Get incomplete callback forms specifically
      const { incompleteAssignmentIds } = await getIncompleteRequiredCallbackForms(auditionId);
      console.log('📋 Incomplete callback assignment IDs:', incompleteAssignmentIds);
      
      // Get callback form assignments directly
      const { getUser } = await import('@/lib/supabase/auth');
      const user = await getUser();
      if (!user) {
        console.log('❌ No user found');
        setAssignments([]);
        setIncompleteFormIds([]);
        return;
      }

      console.log('👤 Current user:', user.id);

      // Get audition's required callback forms
      const { supabase } = await import('@/lib/supabase/client');
      const { data: audition } = await supabase
        .from('auditions')
        .select('required_callback_forms')
        .eq('audition_id', auditionId)
        .single();

      const requiredCallbackFormIds = audition?.required_callback_forms || [];
      console.log('📝 Required callback form IDs from audition:', requiredCallbackFormIds);
      
      if (requiredCallbackFormIds.length === 0) {
        console.log('⚠️ No required callback forms configured for this audition');
        setAssignments([]);
        setIncompleteFormIds([]);
        return;
      }

      // Get callback form assignments
      const { data: assignments } = await supabase
        .from('custom_form_assignments')
        .select(`
          *,
          custom_forms (*)
        `)
        .eq('target_type', 'audition')
        .eq('target_id', auditionId)
        .eq('required', true)
        .eq('filled_out_by', 'assignee')
        .in('form_id', requiredCallbackFormIds)
        .order('created_at', { ascending: true });

      console.log('📋 Callback form assignments found:', assignments);

      // Check completion status
      const assignmentIds = (assignments || []).map((a: any) => a.assignment_id);
      console.log('🔢 Assignment IDs:', assignmentIds);
      let completedIds = new Set<string>();
      
      if (assignmentIds.length > 0) {
        const { data: responses } = await supabase
          .from('custom_form_responses')
          .select('assignment_id')
          .in('assignment_id', assignmentIds)
          .eq('respondent_user_id', user.id);

        console.log('✅ Form responses found:', responses);
        completedIds = new Set((responses || []).map((r: any) => r.assignment_id));
      }

      const callbackAssignments = (assignments || []).map((a: any) => ({
        ...a,
        form: a.custom_forms,
        is_complete: completedIds.has(a.assignment_id),
      }));
      
      setAssignments(callbackAssignments);
      setIncompleteFormIds(incompleteAssignmentIds);
    } catch (error) {
      console.error('Error loading callback forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFormAssignments();
  };

  const allFormsComplete = incompleteFormIds.length === 0;
  const hasRequiredForms = assignments.length > 0;

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="neu-card-raised w-full max-w-2xl transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title
                      as="h2"
                      className="text-2xl font-bold text-neu-text-primary mb-2"
                    >
                      📋 Required Forms for Callback
                    </Dialog.Title>
                    {callbackDetails && (
                      <Dialog.Description className="text-sm text-neu-text-primary/70 space-y-1">
                        {callbackDetails.showTitle && (
                          <p className="font-semibold">{callbackDetails.showTitle}</p>
                        )}
                        {callbackDetails.date && (
                          <p>📅 {callbackDetails.date}</p>
                        )}
                        {callbackDetails.time && (
                          <p>⏰ {callbackDetails.time}</p>
                        )}
                        {callbackDetails.location && (
                          <p>📍 {callbackDetails.location}</p>
                        )}
                      </Dialog.Description>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neu-text-primary/50 hover:text-neu-text-primary transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-neu-text-primary/70">Loading required forms...</div>
                  </div>
                ) : !hasRequiredForms ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neu-text-primary mb-2">
                      No Forms Required
                    </h3>
                    <p className="text-neu-text-primary/70 mb-6">
                      You can proceed to accept this callback invitation.
                    </p>
                    <button
                      onClick={onFormsCompleted}
                      className="n-button-primary"
                    >
                      Continue to Accept Callback
                    </button>
                  </div>
                ) : allFormsComplete ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neu-text-primary mb-2">
                      All Forms Completed! ✅
                    </h3>
                    <p className="text-neu-text-primary/70 mb-6">
                      You have completed all required forms and can now accept this callback invitation.
                    </p>
                    <button
                      onClick={onFormsCompleted}
                      className="n-button-primary"
                    >
                      Continue to Accept Callback
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Warning Message */}
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-yellow-500 mb-1">
                            Forms Required Before Acceptance
                          </h3>
                          <p className="text-sm text-neu-text-primary/70">
                            You must complete {incompleteFormIds.length} required form{incompleteFormIds.length !== 1 ? 's' : ''} before you can accept this callback invitation.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Forms List */}
                    <div className="space-y-3 mb-6">
                      {assignments.map((assignment) => {
                        const formName = assignment.form?.name || 'Untitled Form';
                        const isIncomplete = incompleteFormIds.includes(assignment.assignment_id);
                        const statusClass = isIncomplete ? 'neu-badge-warning' : 'neu-badge-success';
                        const statusLabel = isIncomplete ? 'Required' : 'Complete';
                        const statusIcon = isIncomplete ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;

                        return (
                          <div key={assignment.assignment_id} className="flex items-center justify-between p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-neu-text-primary/70" />
                              <div>
                                <div className="font-medium text-neu-text-primary">{formName}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  {statusIcon}
                                  <span className={`${statusClass} text-xs`}>{statusLabel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {isIncomplete ? (
                                <Link
                                  href={`/my-forms/${assignment.assignment_id}?returnTo=${encodeURIComponent(window.location.pathname)}`}
                                  onClick={onClose}
                                >
                                  <button className="n-button-primary text-sm px-3 py-2">
                                    Complete Form
                                  </button>
                                </Link>
                              ) : (
                                <>
                                  <Link
                                    href={`/my-forms/${assignment.assignment_id}?mode=view&returnTo=${encodeURIComponent(window.location.pathname)}`}
                                    onClick={onClose}
                                  >
                                    <button className="n-button-secondary text-sm px-3 py-2">
                                      View
                                    </button>
                                  </Link>
                                  <Link
                                    href={`/my-forms/${assignment.assignment_id}?mode=edit&returnTo=${encodeURIComponent(window.location.pathname)}`}
                                    onClick={onClose}
                                  >
                                    <button className="n-button-primary text-sm px-3 py-2">
                                      Edit
                                    </button>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className="n-button-secondary flex-1"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="n-button-primary flex-1"
                        onClick={handleRefresh}
                      >
                        Refresh Status
                      </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-neu-text-primary/60">
                        Complete all required forms, then click "Refresh Status" to proceed with accepting the callback.
                      </p>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
