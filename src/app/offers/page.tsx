'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserOffers, getUserPendingOffers } from '@/lib/supabase/castingOffers';
import type { CastingOfferWithDetails } from '@/lib/supabase/types';
import StarryContainer from '@/components/StarryContainer';
import CastingOfferCard from '@/components/casting/CastingOfferCard';

export default function OffersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [allOffers, setAllOffers] = useState<CastingOfferWithDetails[]>([]);
  const [pendingOffers, setPendingOffers] = useState<CastingOfferWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const currentUser = await getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Load all offers
    const offers = await getUserOffers(currentUser.id);
    setAllOffers(offers);

    // Load pending offers
    const pending = await getUserPendingOffers(currentUser.id);
    setPendingOffers(pending);

    setLoading(false);
  };

  const acceptedOffers = allOffers.filter(o => o.cast_member?.status === 'Accepted');
  const declinedOffers = allOffers.filter(o => o.cast_member?.status === 'Declined');

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading your offers...</div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neu-text-primary mb-2">My Casting Offers</h1>
            <p className="text-neu-text-secondary">
              View and respond to casting offers from productions
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-neu-text-primary">{allOffers.length}</div>
              <div className="text-sm text-neu-text-secondary">Total Offers</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-yellow-400">{pendingOffers.length}</div>
              <div className="text-sm text-neu-text-secondary">Pending</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-green-400">{acceptedOffers.length}</div>
              <div className="text-sm text-neu-text-secondary">Accepted</div>
            </div>
            <div className="p-4 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
              <div className="text-2xl font-bold text-red-400">{declinedOffers.length}</div>
              <div className="text-sm text-neu-text-secondary">Declined</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all border ${
                activeTab === 'pending'
                  ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary text-neu-accent-primary'
                  : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border text-neu-text-primary hover:border-neu-accent-primary/50'
              }`}
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              Pending ({pendingOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all border ${
                activeTab === 'all'
                  ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-neu-accent-primary text-neu-accent-primary'
                  : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border-neu-border text-neu-text-primary hover:border-neu-accent-primary/50'
              }`}
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              All Offers ({allOffers.length})
            </button>
          </div>

          {/* Offers List */}
          <div className="space-y-4">
            {activeTab === 'pending' && (
              <>
                {pendingOffers.length === 0 ? (
                  <div className="p-12 text-center rounded-xl border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <p className="text-neu-text-secondary text-lg mb-2">No pending offers</p>
                    <p className="text-neu-text-secondary text-sm">
                      You're all caught up! Check back later for new casting opportunities.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-neu-text-primary">
                        Pending Offers - Action Required
                      </h2>
                      <p className="text-sm text-neu-text-secondary">
                        Please review and respond to these offers
                      </p>
                    </div>
                    {pendingOffers.map((offer) => (
                      <CastingOfferCard
                        key={offer.offer_id}
                        offer={offer}
                        userId={user.id}
                        onUpdate={loadData}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {activeTab === 'all' && (
              <>
                {allOffers.length === 0 ? (
                  <div className="p-12 text-center rounded-xl border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <p className="text-neu-text-secondary text-lg mb-2">No offers yet</p>
                    <p className="text-neu-text-secondary text-sm">
                      Audition for shows to receive casting offers
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Pending Section */}
                    {pendingOffers.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-neu-text-primary mb-4">
                          Pending ({pendingOffers.length})
                        </h2>
                        <div className="space-y-4">
                          {pendingOffers.map((offer) => (
                            <CastingOfferCard
                              key={offer.offer_id}
                              offer={offer}
                              userId={user.id}
                              onUpdate={loadData}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accepted Section */}
                    {acceptedOffers.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-neu-text-primary mb-4">
                          Accepted ({acceptedOffers.length})
                        </h2>
                        <div className="space-y-4">
                          {acceptedOffers.map((offer) => (
                            <CastingOfferCard
                              key={offer.offer_id}
                              offer={offer}
                              userId={user.id}
                              onUpdate={loadData}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Declined Section */}
                    {declinedOffers.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-neu-text-primary mb-4">
                          Declined ({declinedOffers.length})
                        </h2>
                        <div className="space-y-4">
                          {declinedOffers.map((offer) => (
                            <CastingOfferCard
                              key={offer.offer_id}
                              offer={offer}
                              userId={user.id}
                              onUpdate={loadData}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StarryContainer>
  );
}
