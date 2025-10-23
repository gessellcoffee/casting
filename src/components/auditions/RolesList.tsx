'use client';

import { useState } from 'react';

interface RolesListProps {
  roles: any[];
  showId: string;
}

export default function RolesList({ roles, showId }: RolesListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!roles || roles.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl bg-neu-surface/50 border border-neu-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-2xl font-semibold text-neu-text-primary group-hover:text-neu-accent-primary transition-colors">
          Roles {roles.length > 0 && `(${roles.length})`}
        </h2>
        <span className="text-neu-text-primary group-hover:text-neu-accent-primary transition-all duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.role_id}
            className="p-4 rounded-lg bg-neu-surface/50 border border-[#4a7bd9]/10"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-neu-text-primary">
                {role.role_name}
              </h3>
              <div className="flex gap-2">
                {role.role_type && (
                  <span className="px-2 py-1 rounded text-xs bg-neu-surface/80 border border-neu-border-focus text-neu-text-primary shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
                    {role.role_type}
                  </span>
                )}
                {role.gender && (
                  <span className="px-2 py-1 rounded text-xs bg-neu-surface/80 border border-neu-border text-neu-accent-secondary capitalize shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
                    {role.gender}
                  </span>
                )}
              </div>
            </div>

            {role.description && (
              <p className="text-neu-text-primary/70 text-sm">
                {role.description}
              </p>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
