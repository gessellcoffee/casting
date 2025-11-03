'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptCastingOffer, declineCastingOffer } from '@/lib/supabase/castingOffers';
import type { CastingOfferWithDetails } from '@/lib/supabase/types';
import OfferStatusBadge from './OfferStatusBadge';
import Button from '@/components/Button';

interface CastingOfferCardProps {
  offer: CastingOfferWithDetails;
  userId: string;
  onUpdate?: () => void;
}

export default function CastingOfferCard({ offer, userId, onUpdate }: CastingOfferCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept this casting offer?')) {
      return;
    }

    setAccepting(true);
    const { error } = await acceptCastingOffer(offer.offer_id, userId);

    if (error) {
      alert('Failed to accept offer: ' + error.message);
      setAccepting(false);
      return;
    }

    alert('Offer accepted successfully!');
    setAccepting(false);
    onUpdate?.();
  };

  const handleDecline = async () => {
    if (!confirm('Are you sure you want to decline this casting offer?')) {
      return;
    }

    setDeclining(true);
    const { error } = await declineCastingOffer(offer.offer_id, userId);

    if (error) {
      alert('Failed to decline offer: ' + error.message);
      setDeclining(false);
      return;
    }

    alert('Offer declined.');
    setDeclining(false);
    onUpdate?.();
  };

  const showTitle = offer.auditions?.shows?.title || 'Untitled Show';
  const roleName = offer.roles?.role_name || 'Ensemble';
  const isUnderstudy = offer.cast_members?.is_understudy || false;
  const status = offer.cast_members?.status || null;
  const isPending = status === 'Offered' && !offer.responded_at;

  return (
    <div className="p-6 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-neu-text-primary mb-1">{showTitle}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-neu-text-secondary">
              {isUnderstudy ? `Understudy - ${roleName}` : roleName}
            </span>
            <OfferStatusBadge status={status} />
          </div>
          {offer.auditions?.shows?.author && (
            <p className="text-sm text-neu-text-secondary">by {offer.auditions.shows.author}</p>
          )}
        </div>
        <button
          onClick={() => router.push(`/auditions/${offer.audition_id}`)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-neu-accent-primary hover:text-neu-accent-secondary transition-colors"
        >
          View Details →
        </button>
      </div>

      {/* Offer Message */}
      {offer.offer_message && (
        <div className="mb-4 p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
          <p className="text-sm text-neu-text-secondary mb-1 font-semibold">Message from Casting Director:</p>
          <p className="text-neu-text-primary whitespace-pre-wrap">{offer.offer_message}</p>
        </div>
      )}

      {/* Role Details */}
      {offer.roles?.description && (
        <div className="mb-4">
          <p className="text-sm text-neu-text-secondary mb-1 font-semibold">Role Description:</p>
          <p className="text-sm text-neu-text-primary">{offer.roles.description}</p>
        </div>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-sm text-neu-text-secondary mb-4">
        <div>
          <span className="font-medium">Sent:</span> {new Date(offer.sent_at).toLocaleDateString()}
        </div>
        {offer.responded_at && (
          <div>
            <span className="font-medium">Responded:</span> {new Date(offer.responded_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-3 pt-4 border-t border-neu-border">
          <Button
            text={declining ? 'Declining...' : 'Decline'}
            onClick={handleDecline}
            disabled={declining || accepting}
            variant="secondary"
            className="flex-1"
          />
          <Button
            text={accepting ? 'Accepting...' : 'Accept Offer'}
            onClick={handleAccept}
            disabled={accepting || declining}
            variant="primary"
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}
