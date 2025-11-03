'use client';

import { useState, useEffect } from 'react';
import { getAuditionOffers, getOfferStats } from '@/lib/supabase/castingOffers';
import { supabase } from '@/lib/supabase/client';
import type { CastingOfferWithDetails } from '@/lib/supabase/types';
import SendOfferModal from './SendOfferModal';
import OfferStatusBadge from './OfferStatusBadge';
import { formatUSDate } from '@/lib/utils/dateUtils';

interface CastingOffersPanelProps {
  auditionId: string;
  currentUserId: string;
}

export default function CastingOffersPanel({ auditionId, currentUserId }: CastingOffersPanelProps) {
  const [offers, setOffers] = useState<CastingOfferWithDetails[]>([]);
  const [auditionSignups, setAuditionSignups] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, declined: 0 });

  useEffect(() => {
    loadData();
  }, [auditionId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load offers
    const offersData = await getAuditionOffers(auditionId);
    setOffers(offersData);

    // Load stats
    const statsData = await getOfferStats(auditionId);
    setStats(statsData);

    // Load audition signups to show actors who auditioned
    const { data: signupsData } = await supabase
      .from('audition_signups')
      .select(`
        signup_id,
        user_id,
        profiles (
          id,
          first_name,
          last_name,
          username,
          email,
          profile_photo_url
        ),
        audition_slots!inner (
          audition_id
        )
      `)
      .eq('audition_slots.audition_id', auditionId);

    // Get unique users
    const uniqueUsers = new Map();
    signupsData?.forEach((signup: any) => {
      if (signup.profiles && !uniqueUsers.has(signup.user_id)) {
        uniqueUsers.set(signup.user_id, {
          userId: signup.user_id,
          ...signup.profiles,
        });
      }
    });

    setAuditionSignups(Array.from(uniqueUsers.values()));
    setLoading(false);
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === auditionSignups.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(auditionSignups.map(u => u.userId)));
    }
  };

  const handleSendOffers = () => {
    setShowSendOfferModal(true);
  };

  const handleOfferSuccess = () => {
    setShowSendOfferModal(false);
    setSelectedUsers(new Set());
    loadData();
  };

  const getOfferForUser = (userId: string) => {
    return offers.find(offer => offer.user_id === userId);
  };

  const selectedUsersData = auditionSignups.filter(u => selectedUsers.has(u.userId));

  if (loading) {
    return (
      <div className="p-8 text-center text-neu-text-secondary">
        Loading casting offers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="text-2xl font-bold text-neu-text-primary">{stats.total}</div>
          <div className="text-sm text-neu-text-secondary">Total Offers</div>
        </div>
        <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-neu-text-secondary">Pending</div>
        </div>
        <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
          <div className="text-sm text-neu-text-secondary">Accepted</div>
        </div>
        <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="text-2xl font-bold text-red-400">{stats.declined}</div>
          <div className="text-sm text-neu-text-secondary">Declined</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-neu-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={selectedUsers.size === auditionSignups.length && auditionSignups.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-neu-border bg-neu-surface text-neu-accent-primary focus:ring-neu-accent-primary"
            />
            <span className="text-sm font-medium">Select All</span>
          </label>
          {selectedUsers.size > 0 && (
            <span className="text-sm text-neu-text-secondary">
              {selectedUsers.size} selected
            </span>
          )}
        </div>
        <button
          onClick={handleSendOffers}
          disabled={selectedUsers.size === 0}
          className="px-6 py-3 rounded-xl bg-neu-accent-primary text-white font-semibold shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {selectedUsers.size > 1 ? `Send Offers (${selectedUsers.size})` : 'Send Offer'}
        </button>
      </div>

      {/* Actors List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-neu-text-primary">Actors Who Auditioned</h3>
        {auditionSignups.length === 0 ? (
          <div className="p-8 text-center text-neu-text-secondary rounded-xl border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
            No actors have auditioned yet
          </div>
        ) : (
          <div className="space-y-2">
            {auditionSignups.map((actor) => {
              const offer = getOfferForUser(actor.userId);
              const isSelected = selectedUsers.has(actor.userId);

              return (
                <div
                  key={actor.userId}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border-neu-accent-primary'
                      : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border'
                  }`}
                  style={{ backgroundColor: 'var(--neu-surface)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleUser(actor.userId)}
                        className="w-4 h-4 rounded border-neu-border bg-neu-surface text-neu-accent-primary focus:ring-neu-accent-primary"
                      />
                      {actor.profile_photo_url ? (
                        <img
                          src={actor.profile_photo_url}
                          alt={actor.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-neu-accent-primary/20 flex items-center justify-center text-neu-accent-primary font-semibold">
                          {(actor.first_name?.[0] || actor.username[0]).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-neu-text-primary">
                          {actor.first_name && actor.last_name
                            ? `${actor.first_name} ${actor.last_name}`
                            : actor.username}
                        </div>
                        {actor.email && (
                          <div className="text-sm text-neu-text-secondary">{actor.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {offer ? (
                        <>
                          <OfferStatusBadge status={offer.cast_members?.status || null} />
                          {offer.roles && (
                            <span className="text-sm text-neu-text-secondary">
                              {offer.cast_members?.is_understudy ? 'Understudy - ' : ''}
                              {offer.roles.role_name}
                            </span>
                          )}
                          {!offer.roles && (
                            <span className="text-sm text-neu-text-secondary">Ensemble</span>
                          )}
                          <span className="text-xs text-neu-text-secondary">
                            {formatUSDate(offer.sent_at)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-neu-text-secondary italic">No offer sent</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Offer Modal */}
      {showSendOfferModal && (
        <SendOfferModal
          auditionId={auditionId}
          users={selectedUsersData.map(u => ({
            userId: u.userId,
            firstName: u.first_name,
            lastName: u.last_name,
            username: u.username,
            email: u.email,
          }))}
          currentUserId={currentUserId}
          onClose={() => setShowSendOfferModal(false)}
          onSuccess={handleOfferSuccess}
        />
      )}
    </div>
  );
}
