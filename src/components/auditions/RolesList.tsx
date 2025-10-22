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
    <div className="p-6 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-2xl font-semibold text-[#c5ddff] group-hover:text-[#5a8ff5] transition-colors">
          Roles {roles.length > 0 && `(${roles.length})`}
        </h2>
        <span className="text-[#c5ddff] group-hover:text-[#5a8ff5] transition-all duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.role_id}
            className="p-4 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/10"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-[#c5ddff]">
                {role.role_name}
              </h3>
              <div className="flex gap-2">
                {role.role_type && (
                  <span className="px-2 py-1 rounded text-xs bg-[#2e3e5e]/80 border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
                    {role.role_type}
                  </span>
                )}
                {role.gender && (
                  <span className="px-2 py-1 rounded text-xs bg-[#2e3e5e]/80 border border-[#4a7bd9]/30 text-[#94b0f6] capitalize shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]">
                    {role.gender}
                  </span>
                )}
              </div>
            </div>

            {role.description && (
              <p className="text-[#c5ddff]/70 text-sm">
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
