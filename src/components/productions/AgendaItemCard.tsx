'use client';

import { useState } from 'react';
import { MdPerson, MdCheck, MdClose, MdWarning, MdAccessTime } from 'react-icons/md';
import Avatar from '@/components/shared/Avatar';
import Button from '@/components/Button';

// Helper function to format time string (HH:MM:SS or HH:MM) to 12-hour format
function formatTimeString(timeString: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

interface AgendaAssignment {
  agenda_assignments_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'conflict';
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
  };
}

interface AgendaItemCardProps {
  item: {
    rehearsal_agenda_items_id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
    agenda_assignments?: AgendaAssignment[];
  };
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddAssignment?: () => void;
  onAssignAll?: () => void;
  onRemoveAssignment?: (assignmentId: string) => void;
}

export default function AgendaItemCard({
  item,
  canManage,
  onEdit,
  onDelete,
  onAddAssignment,
  onAssignAll,
  onRemoveAssignment,
}: AgendaItemCardProps) {
  const [showAssignments, setShowAssignments] = useState(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <MdCheck className="w-4 h-4 text-green-400" title="Accepted" />;
      case 'declined':
        return <MdClose className="w-4 h-4 text-red-400" title="Declined" />;
      case 'conflict':
        return <MdWarning className="w-4 h-4 text-yellow-400" title="Conflict Reported" />;
      default:
        return null;
    }
  };

  return (
    <div className="neu-card-raised p-4 hover:shadow-neu-raised-lg transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Title and Time */}
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold text-neu-text-primary">
              {item.title}
            </h4>
            <div className="flex items-center gap-1 text-sm text-neu-text-secondary px-2 py-1 rounded-lg bg-neu-surface-light">
              <MdAccessTime className="w-4 h-4" />
              <span>
                {formatTimeString(item.start_time)} - {formatTimeString(item.end_time)}
              </span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-neu-text-secondary mb-3">
              {item.description}
            </p>
          )}

          {/* Assignments */}
          {item.agenda_assignments && item.agenda_assignments.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowAssignments(!showAssignments)}
                className="text-sm font-medium text-neu-accent-primary hover:text-neu-accent-secondary transition-colors mb-2"
              >
                <MdPerson className="inline w-4 h-4 mr-1" />
                {item.agenda_assignments.length} Assigned
              </button>

              {showAssignments && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.agenda_assignments.map((assignment) => (
                    <div
                      key={assignment.agenda_assignments_id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neu-surface-light border border-neu-border"
                    >
                      <Avatar
                        src={assignment.profiles.profile_photo_url}
                        alt={`${assignment.profiles.first_name} ${assignment.profiles.last_name}`}
                        size="sm"
                      />
                      <span className="text-sm text-neu-text-primary">
                        {assignment.profiles.first_name} {assignment.profiles.last_name}
                      </span>
                      {getStatusIcon(assignment.status)}
                      {canManage && onRemoveAssignment && (
                        <button
                          onClick={() => onRemoveAssignment(assignment.agenda_assignments_id)}
                          className="ml-1 p-1 hover:bg-neu-surface transition-colors rounded"
                          title="Remove assignment"
                        >
                          <MdClose className="w-4 h-4 text-neu-text-secondary" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Assignment Button */}
          {canManage && (
            <div className="flex items-center gap-4 mt-2">
              {onAddAssignment && (
                <Button
                  onClick={onAddAssignment}
                  className="text-sm text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-1"
                  text="Assign Cast Member"
                />
              )}

              {item.agenda_assignments?.length === 0 && onAssignAll && (
                <Button
                  onClick={onAssignAll}
                  className="text-sm text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-1"
                  text="Assign All Cast"
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                onClick={onEdit}
                className="neu-button-primary"
                title="Edit Item"
                text="Edit Item"
              />
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                className="neu-button text-red-500 hover:text-red-600"
                title="Delete Item"
                text="Delete Item"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
