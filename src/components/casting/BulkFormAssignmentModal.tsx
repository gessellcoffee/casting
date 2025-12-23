'use client';

import { useState, useEffect } from 'react';
import { getCustomForms, sendFormToUsers } from '@/lib/supabase/customForms';
import { getAuditionCastMembers } from '@/lib/supabase/castMembers';
import FormSelect from '@/components/ui/forms/FormSelect';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import { X, Send, Users } from 'lucide-react';

interface BulkFormAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditionId: string;
  auditionTitle: string;
}

export default function BulkFormAssignmentModal({
  isOpen,
  onClose,
  auditionId,
  auditionTitle,
}: BulkFormAssignmentModalProps) {
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, auditionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load published forms
      const forms = await getCustomForms();
      const publishedForms = forms.filter(form => form.status === 'published');
      setAvailableForms(publishedForms);

      // Load cast members
      const members = await getAuditionCastMembers(auditionId);
      setCastMembers(members || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading bulk form assignment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === castMembers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(castMembers.map(member => member.user_id));
    }
  };

  const handleSendForm = async () => {
    if (!selectedFormId || selectedUserIds.length === 0) {
      setError('Please select a form and at least one cast member.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: sendError } = await sendFormToUsers({
        formId: selectedFormId,
        userIds: selectedUserIds,
        auditionId,
        message: customMessage.trim() || undefined,
      });

      if (sendError) {
        setError(sendError.message || 'Failed to send form assignments.');
        return;
      }

      const selectedForm = availableForms.find(f => f.form_id === selectedFormId);
      setSuccess(`Successfully sent "${selectedForm?.name}" to ${selectedUserIds.length} cast member${selectedUserIds.length !== 1 ? 's' : ''}.`);
      
      // Reset form after successful send
      setSelectedFormId('');
      setSelectedUserIds([]);
      setCustomMessage('');
      
      // Auto-close after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error sending bulk form assignment:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSelectedFormId('');
      setSelectedUserIds([]);
      setCustomMessage('');
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="neu-modal-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neu-text-primary">
              Send Form to Cast
            </h2>
            <p className="text-sm text-neu-text-primary/70 mt-1">
              Send a form to multiple cast members for {auditionTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="neu-icon-btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-neu-text-primary/70">Loading...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Form Selection */}
            <div>
              <FormSelect
                label="Select Form"
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                required
              >
                <option value="">Choose a form to send...</option>
                {availableForms.map(form => (
                  <option key={form.form_id} value={form.form_id}>
                    {form.name}
                  </option>
                ))}
              </FormSelect>
              {availableForms.length === 0 && (
                <p className="text-sm text-neu-text-primary/60 mt-2">
                  No published forms available. Create and publish forms first.
                </p>
              )}
            </div>

            {/* Cast Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-neu-text-primary">
                  Select Cast Members ({selectedUserIds.length} selected)
                </label>
                {castMembers.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-neu-accent-primary hover:text-neu-accent-secondary transition-colors"
                  >
                    {selectedUserIds.length === castMembers.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {castMembers.length === 0 ? (
                <div className="neu-card-inset p-4 rounded-lg text-center">
                  <Users className="w-8 h-8 text-neu-text-primary/50 mx-auto mb-2" />
                  <p className="text-neu-text-primary/70">No cast members found for this production.</p>
                </div>
              ) : (
                <div className="neu-card-inset p-4 rounded-lg max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {castMembers.map(member => (
                      <label
                        key={member.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-neu-surface/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(member.user_id)}
                          onChange={() => handleUserToggle(member.user_id)}
                          className="w-4 h-4 rounded border-2 border-neu-border bg-neu-surface checked:bg-neu-accent-primary checked:border-neu-accent-primary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-neu-text-primary">
                            {member.full_name || 'Unknown User'}
                          </div>
                          {member.role_name && (
                            <div className="text-xs text-neu-text-primary/60">
                              {member.role_name}
                              {member.is_understudy && ' (Understudy)'}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Message */}
            <div>
              <FormTextarea
                label="Custom Message (Optional)"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                placeholder="Add a custom message to include with the form assignment..."
              />
              <p className="text-xs text-neu-text-primary/60 mt-1">
                If no message is provided, a default message will be sent.
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="neu-card-raised p-4 rounded-lg text-neu-accent-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="neu-card-raised p-4 rounded-lg text-neu-accent-success">
                {success}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={sending}
                className="neu-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSendForm}
                disabled={sending || !selectedFormId || selectedUserIds.length === 0}
                className="neu-button-primary flex-1 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : `Send to ${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
