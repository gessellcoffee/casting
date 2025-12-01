'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, User, Download, Eye } from 'lucide-react';
import { acceptCastingOffer, declineCastingOffer } from '@/lib/supabase/castingOffers';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import Button from '@/components/Button';
import { formatUSDate } from '@/lib/utils/dateUtils';

interface ActorShowCardProps {
  show: any;
  userId: string;
  onUpdate: () => void;
}

export default function ActorShowCard({ show, userId, onUpdate }: ActorShowCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

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

  const handleAccept = async () => {
    // Find the casting offer ID - we need to query for it
    // For now, we'll need to pass this from the parent or fetch it
    // This is a simplified version - you may need to adjust based on your data structure
    const acceptAction = async () => {
      setAccepting(true);
      // Note: You'll need to fetch the offer_id if it's not in the show data
      // For now, we'll just show an alert
      openModal('Feature Coming Soon', 'Accept/Decline functionality requires casting offer integration.', undefined, 'OK', false);
      setAccepting(false);
      // const { error } = await acceptCastingOffer(show.offer_id, userId);
      // if (error) {
      //   openModal('Error', `Failed to accept offer: ${error.message}`, undefined, 'OK', false);
      //   setAccepting(false);
      //   return;
      // }
      // openModal('Offer Accepted', 'You have successfully accepted the offer!', undefined, 'OK', false);
      // setAccepting(false);
      // onUpdate?.();
    };

    openModal('Confirm Acceptance', 'Are you sure you want to accept this casting offer?', acceptAction, 'Accept');
  };

  const handleDecline = async () => {
    const declineAction = async () => {
      setDeclining(true);
      openModal('Feature Coming Soon', 'Accept/Decline functionality requires casting offer integration.', undefined, 'OK', false);
      setDeclining(false);
    };

    openModal('Confirm Decline', 'Are you sure you want to decline this casting offer? This action cannot be undone.', declineAction, 'Decline');
  };

  const viewCalendar = () => {
    router.push(`/my-shows/${show.audition_id}/calendar`);
  };

  const downloadPDF = () => {
    router.push(`/my-shows/${show.audition_id}/calendar?download=pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-400';
      case 'Offered':
        return 'bg-yellow-400';
      case 'Declined':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'Accepted';
      case 'Offered':
        return 'Pending';
      case 'Declined':
        return 'Declined';
      default:
        return status;
    }
  };

  const getWorkflowBadge = (workflow: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      auditioning: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Auditioning' },
      casting: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Casting' },
      offering_roles: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Offering Roles' },
      rehearsing: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Rehearsing' },
      performing: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Performing' },
      completed: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Completed' },
    };

    const badge = badges[workflow] || badges.auditioning;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border border-current`}>
        {badge.label}
      </span>
    );
  };

  const isPending = show.status === 'Offered';
  const isAccepted = show.status === 'Accepted';

  return (
    <>
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmButtonText={modalConfig.confirmButtonText}
        showCancel={modalConfig.showCancel}
      />
      
      <div className="p-6 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] border border-neu-border hover:border-neu-accent-primary/50 transition-colors" style={{ backgroundColor: 'var(--neu-surface)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-neu-text-primary">{show.show_title}</h3>
              {getWorkflowBadge(show.workflow_status)}
            </div>
            
            {show.show_author && (
              <p className="text-sm text-neu-text-secondary mb-2">by {show.show_author}</p>
            )}

            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-neu-accent-primary" />
              <span className="text-neu-text-primary font-medium">
                {show.is_understudy ? `Understudy - ${show.role_name}` : show.role_name}
              </span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(show.status)} text-white`}>
                {getStatusText(show.status)}
              </span>
            </div>

            {show.company_name && (
              <p className="text-sm text-neu-text-secondary mb-2">
                <span className="font-medium">Company:</span> {show.company_name}
              </p>
            )}

            {show.role_description && (
              <p className="text-sm text-neu-text-secondary mt-2 line-clamp-2">
                {show.role_description}
              </p>
            )}
          </div>
        </div>

        {/* Dates Info */}
        {(show.auditions?.rehearsal_dates || show.auditions?.performance_dates) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-b border-neu-border my-4">
            {show.auditions?.rehearsal_dates && show.auditions.rehearsal_dates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-neu-text-secondary mb-1">
                  <Calendar size={14} />
                  <span className="font-medium">Rehearsals</span>
                </div>
                <p className="text-sm text-neu-text-primary">
                  {formatUSDate(show.auditions.rehearsal_dates[0])} - {formatUSDate(show.auditions.rehearsal_dates[show.auditions.rehearsal_dates.length - 1])}
                </p>
                {show.auditions.rehearsal_location && (
                  <div className="flex items-center gap-1 text-xs text-neu-text-secondary mt-1">
                    <MapPin size={12} />
                    {show.auditions.rehearsal_location}
                  </div>
                )}
              </div>
            )}

            {show.auditions?.performance_dates && show.auditions.performance_dates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-neu-text-secondary mb-1">
                  <Calendar size={14} />
                  <span className="font-medium">Performances</span>
                </div>
                <p className="text-sm text-neu-text-primary">
                  {formatUSDate(show.auditions.performance_dates[0])} - {formatUSDate(show.auditions.performance_dates[show.auditions.performance_dates.length - 1])}
                </p>
                {show.auditions.performance_location && (
                  <div className="flex items-center gap-1 text-xs text-neu-text-secondary mt-1">
                    <MapPin size={12} />
                    {show.auditions.performance_location}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {isPending && (
            <>
              <Button
                onClick={handleDecline}
                disabled={declining || accepting}
                variant="danger"
                text={declining ? 'Declining...' : 'Decline'}
              />
              <Button
                onClick={handleAccept}
                disabled={accepting || declining}
                variant="primary"
                text={accepting ? 'Accepting...' : 'Accept Offer'}
              />
            </>
          )}

          {isAccepted && (
            <>
              <Button
                onClick={viewCalendar}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                <span>View Calendar</span>
              </Button>
              <Button
                onClick={downloadPDF}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                <span>Download PDF</span>
              </Button>
            </>
          )}

          <Button
            onClick={() => router.push(`/auditions/${show.audition_id}`)}
            variant="secondary"
            className="ml-auto"
            text="View Production →"
          />
        </div>
      </div>
    </>
  );
}
