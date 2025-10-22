'use client';

import { useState, useEffect } from 'react';
import { getAuditionSignups } from '@/lib/supabase/auditionSignups';
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
      // Load all auditionees (signups)
      const signups = await getAuditionSignups(audition.audition_id);
      setAuditionees(signups);

      // Load callback slots with invitations
      const slots = await getCallbackSlotsWithInvitations(audition.audition_id);
      setCallbackSlots(slots);

      // Calculate stats
      const allInvitations = slots.flatMap(slot => slot.callback_invitations || []);
      setStats({
        totalAuditionees: signups.length,
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
        <div className="text-[#c5ddff]/70">Loading callback data...</div>
      </div>
    );
  }

  // Overview Mode
  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
            <div className="text-sm text-[#c5ddff]/70 mb-1">Total Auditionees</div>
            <div className="text-2xl font-bold text-[#c5ddff]">{stats.totalAuditionees}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
            <div className="text-sm text-[#c5ddff]/70 mb-1">Callback Slots</div>
            <div className="text-2xl font-bold text-[#c5ddff]">{stats.totalSlots}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
            <div className="text-sm text-[#c5ddff]/70 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingInvitations}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
            <div className="text-sm text-[#c5ddff]/70 mb-1">Accepted</div>
            <div className="text-2xl font-bold text-green-400">{stats.acceptedInvitations}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
            <div className="text-sm text-[#c5ddff]/70 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-400">{stats.rejectedInvitations}</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Create Callback Slots */}
          <button
            onClick={() => setViewMode('create-slots')}
            className="p-6 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 hover:border-[#5a8ff5]/50 transition-all text-left group shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-lg font-semibold text-[#c5ddff] mb-2 group-hover:text-[#5a8ff5] transition-colors">
              1. Create Callback Slots
            </h3>
            <p className="text-sm text-[#c5ddff]/70">
              Set up dates, times, and locations for callbacks
            </p>
            {stats.totalSlots > 0 && (
              <div className="mt-3 text-xs text-[#5a8ff5]">
                {stats.totalSlots} slot{stats.totalSlots !== 1 ? 's' : ''} created
              </div>
            )}
          </button>

          {/* Step 2: Select Auditionees */}
          <button
            onClick={() => setViewMode('select-auditionees')}
            disabled={stats.totalSlots === 0}
            className="p-6 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 hover:border-[#5a8ff5]/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
          >
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-[#c5ddff] mb-2 group-hover:text-[#5a8ff5] transition-colors">
              2. Select Auditionees
            </h3>
            <p className="text-sm text-[#c5ddff]/70">
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
            className="p-6 rounded-xl bg-[#2e3e5e]/80 border border-[#4a7bd9]/20 hover:border-[#5a8ff5]/50 transition-all text-left group shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]"
          >
            <div className="text-3xl mb-3">📧</div>
            <h3 className="text-lg font-semibold text-[#c5ddff] mb-2 group-hover:text-[#5a8ff5] transition-colors">
              3. Manage Invitations
            </h3>
            <p className="text-sm text-[#c5ddff]/70">
              View and manage callback invitation responses
            </p>
            {(stats.pendingInvitations + stats.acceptedInvitations + stats.rejectedInvitations) > 0 && (
              <div className="mt-3 text-xs text-[#5a8ff5]">
                {stats.pendingInvitations + stats.acceptedInvitations + stats.rejectedInvitations} invitation{(stats.pendingInvitations + stats.acceptedInvitations + stats.rejectedInvitations) !== 1 ? 's' : ''} sent
              </div>
            )}
          </button>
        </div>

        {/* Quick Info */}
        <div className="p-6 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
          <h3 className="text-lg font-semibold text-[#c5ddff] mb-3">Getting Started</h3>
          <ol className="space-y-2 text-sm text-[#c5ddff]/70">
            <li className="flex items-start gap-2">
              <span className="text-[#5a8ff5] font-semibold">1.</span>
              <span>Create callback time slots with dates, times, and locations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#5a8ff5] font-semibold">2.</span>
              <span>Review auditionees and select who to invite to each callback slot</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#5a8ff5] font-semibold">3.</span>
              <span>Send callback invitations - actors will receive notifications and can accept or decline</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#5a8ff5] font-semibold">4.</span>
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
          className="mb-6 text-[#5a8ff5] hover:text-[#94b0f6] transition-colors flex items-center gap-2"
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
          className="mb-6 text-[#5a8ff5] hover:text-[#94b0f6] transition-colors flex items-center gap-2"
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
          className="mb-6 text-[#5a8ff5] hover:text-[#94b0f6] transition-colors flex items-center gap-2"
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
