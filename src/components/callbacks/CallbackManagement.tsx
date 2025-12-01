'use client';

import { useState, useEffect } from 'react';
import { getAuditionSignups } from '@/lib/supabase/auditionSignups';
import { getAllAuditionees } from '@/lib/supabase/virtualAuditions';
import { getCallbackSlotsWithInvitations } from '@/lib/supabase/callbackSlots';
import CallbackSlotCreator from './CallbackSlotCreator';
import AuditioneeSelector from './AuditioneeSelector';
import CallbackInvitationsList from './CallbackInvitationsList';

interface CallbackManagementProps {
  audition: any;
  user: any;
  onUpdate?: () => void;
}

type ViewMode = 'overview' | 'create-slots' | 'select-auditionees' | 'manage-invitations';

export default function CallbackManagement({ audition, user, onUpdate }: CallbackManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [auditionees, setAuditionees] = useState<any[]>([]);
  const [callbackSlots, setCallbackSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAuditionees: 0,
    totalSlots: 0,
    pendingInvitations: 0,
    acceptedInvitations: 0,
    rejectedInvitations: 0,
  });

  useEffect(() => {
    loadData();
  }, [audition.audition_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all auditionees (both slot signups and virtual submissions)
      const allAuditionees = await getAllAuditionees(audition.audition_id);
      setAuditionees(allAuditionees);

      // Load callback slots with invitations
      const slots = await getCallbackSlotsWithInvitations(audition.audition_id);
      setCallbackSlots(slots);

      // Calculate stats
      const allInvitations = slots.flatMap(slot => slot.callback_invitations || []);
      setStats({
        totalAuditionees: allAuditionees.length,
        totalSlots: slots.length,
        pendingInvitations: allInvitations.filter(inv => inv.status === 'pending').length,
        acceptedInvitations: allInvitations.filter(inv => inv.status === 'accepted').length,
        rejectedInvitations: allInvitations.filter(inv => inv.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Error loading callback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotsCreated = () => {
    loadData();
    setViewMode('select-auditionees');
  };

  const handleInvitationsSent = () => {
    loadData();
    setViewMode('manage-invitations');
    if (onUpdate) onUpdate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neu-text-primary/70">Loading callback data...</div>
      </div>
    );
  }

  // Overview Mode
  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="neu-card-raised m-12">
            <div className="text-sm text-neu-text-primary/70 mb-1">Total Auditionees</div>
            <div className="text-2xl font-bold text-neu-text-primary">{stats.totalAuditionees}</div>
          </div>
          <div className="neu-card-raised m-1">
            <div className="text-sm text-neu-text-primary/70 mb-1">Callback Slots</div>
            <div className="text-2xl font-bold text-neu-text-primary">{stats.totalSlots}</div>
          </div>
          <div className="neu-card-raised m-1">
            <div className="text-sm text-neu-text-primary/70 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingInvitations}</div>
          </div>
          <div className="neu-card-raised m-1">
            <div className="text-sm text-neu-text-primary/70 mb-1">Accepted</div>
            <div className="text-2xl font-bold text-green-400">{stats.acceptedInvitations}</div>
          </div>
          <div className="neu-card-raised m-1">
            <div className="text-sm text-neu-text-primary/70 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-400">{stats.rejectedInvitations}</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Create Callback Slots */}
          <button
            onClick={() => setViewMode('create-slots')}
            className="neu-card-raised p-6 text-left group cursor-pointer hover:shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-lg font-semibold text-neu-text-primary mb-2 group-hover:text-neu-accent-primary transition-colors">
              1. Create Callback Slots
            </h3>
            <p className="text-sm text-neu-text-primary/70">
              Set up dates, times, and locations for callbacks
            </p>
            {stats.totalSlots > 0 && (
              <div className="mt-3 text-xs text-neu-accent-primary">
                {stats.totalSlots} slot{stats.totalSlots !== 1 ? 's' : ''} created
              </div>
            )}
          </button>

          {/* Step 2: Select Auditionees */}
          <button
            onClick={() => setViewMode('select-auditionees')}
            disabled={stats.totalSlots === 0}
            className="neu-card-raised p-6 text-left group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]"
          >
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-neu-text-primary mb-2 group-hover:text-neu-accent-primary transition-colors">
              2. Select Auditionees {stats.totalSlots === 0 ? '(disabled)' : ''}
            </h3>
            <p className="text-sm text-neu-text-primary/70">
              Choose which actors to invite to callbacks
            </p>
            {stats.totalSlots === 0 && (
              <div className="mt-3 text-xs text-yellow-400">
                Create callback slots first
              </div>
            )}
          </button>

          {/* Step 3: Manage Invitations */}
          <button
            onClick={() => setViewMode('manage-invitations')}
            className="neu-card-raised p-6 text-left group cursor-pointer hover:shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]"
          >
            <div className="text-3xl mb-3">📧</div>
            <h3 className="text-lg font-semibold text-neu-text-primary mb-2 group-hover:text-neu-accent-primary transition-colors">
              3. Manage Invitations
            </h3>
            <p className="text-sm text-neu-text-primary/70">
              View and manage callback invitation responses
            </p>
            {(stats.pendingInvitations + stats.acceptedInvitations + stats.rejectedInvitations) > 0 && (
              <div className="mt-3 text-xs text-neu-accent-primary">
                {stats.pendingInvitations + stats.acceptedInvitations + stats.rejectedInvitations} invitation{(stats.pendingInvitations + stats.acceptedInvitations + stats.rejectedInvitations) !== 1 ? 's' : ''} sent
              </div>
            )}
          </button>
        </div>

        {/* Quick Info */}
        <div className="neu-card-raised p-6">
          <h3 className="text-lg font-semibold text-neu-text-primary mb-3">Getting Started</h3>
          <ol className="space-y-2 text-sm text-neu-text-primary/70">
            <li className="flex items-start gap-2">
              <span className="text-neu-accent-primary font-semibold">1.</span>
              <span>Create callback time slots with dates, times, and locations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neu-accent-primary font-semibold">2.</span>
              <span>Review auditionees and select who to invite to each callback slot</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neu-accent-primary font-semibold">3.</span>
              <span>Send callback invitations - actors will receive notifications and can accept or decline</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neu-accent-primary font-semibold">4.</span>
              <span>Monitor responses and manage your callback schedule</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // Create Slots Mode
  if (viewMode === 'create-slots') {
    return (
      <div>
        <button
          onClick={() => setViewMode('overview')}
          className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
        >
          ← Back to Overview
        </button>
        <CallbackSlotCreator
          auditionId={audition.audition_id}
          existingSlots={callbackSlots}
          onSlotsCreated={handleSlotsCreated}
          onCancel={() => setViewMode('overview')}
        />
      </div>
    );
  }

  // Select Auditionees Mode
  if (viewMode === 'select-auditionees') {
    return (
      <div>
        <button
          onClick={() => setViewMode('overview')}
          className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
        >
          ← Back to Overview
        </button>
        <AuditioneeSelector
          auditionId={audition.audition_id}
          auditionees={auditionees}
          callbackSlots={callbackSlots}
          onInvitationsSent={handleInvitationsSent}
          onCancel={() => setViewMode('overview')}
        />
      </div>
    );
  }

  // Manage Invitations Mode
  if (viewMode === 'manage-invitations') {
    return (
      <div>
        <button
          onClick={() => setViewMode('overview')}
          className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
        >
          ← Back to Overview
        </button>
        <CallbackInvitationsList
          auditionId={audition.audition_id}
          callbackSlots={callbackSlots}
          onUpdate={loadData}
        />
      </div>
    );
  }

  return null;
}
