'use client';

import React from 'react';
import type { WorkflowStatus } from '@/lib/supabase/types';
import { getWorkflowStatusInfo } from '@/lib/supabase/workflowStatus';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  showDescription?: boolean;
  className?: string;
}

/**
 * WorkflowStatusBadge Component
 * Displays a colored badge for production workflow status
 */
export default function WorkflowStatusBadge({
  status,
  showDescription = false,
  className = '',
}: WorkflowStatusBadgeProps) {
  const info = getWorkflowStatusInfo(status);

  // Color mapping for neumorphic design
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-400/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    green: 'bg-green-500/20 text-green-400 border-green-400/30',
    red: 'bg-red-500/20 text-red-400 border-red-400/30',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-400/30',
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <span
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
          border transition-all
          ${colorClasses[info.color]}
        `}
        title={info.description}
      >
        {info.label}
      </span>
      {showDescription && (
        <span className="text-xs text-neu-text-secondary">
          {info.description}
        </span>
      )}
    </div>
  );
}
