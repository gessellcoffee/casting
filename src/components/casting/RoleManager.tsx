'use client';

import { useState, useEffect } from 'react';
import { getShowRoles } from '@/lib/supabase/roles';
import type { Role, RoleType, RoleGender } from '@/lib/supabase/types';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import Alert from '@/components/ui/feedback/Alert';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';

interface RoleOperation {
  type: 'create' | 'update' | 'delete';
  role?: any;
  roleId?: string;
}

interface RoleManagerProps {
  showId: string;
  roles: any[];
  onUpdate: (operations: RoleOperation[]) => void;
  onNext: () => void;
  onBack: () => void;
}

interface RoleFormData {
  role_id?: string; // Optional for new roles, required for existing roles
  role_name: string;
  description: string | null;
  role_type: RoleType | null;
  gender: RoleGender | null;
  needs_understudy: boolean;
}

export default function RoleManager({
  showId,
  roles,
  onUpdate,
  onNext,
  onBack,
}: RoleManagerProps) {
  const [localRoles, setLocalRoles] = useState<RoleFormData[]>(roles.length > 0 ? roles : []);
  const [existingRoles, setExistingRoles] = useState<Role[]>([]);
  const [roleOperations, setRoleOperations] = useState<RoleOperation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingRoles();
  }, [showId]);

  const loadExistingRoles = async () => {
    setLoading(true);
    const existingRolesData = await getShowRoles(showId);

    if (existingRolesData.length > 0) {
      setExistingRoles(existingRolesData);
      // Use existing roles from database
      const existingAsFormData = existingRolesData.map(role => ({
        role_id: role.role_id,
        role_name: role.role_name,
        description: role.description,
        role_type: role.role_type,
        gender: role.gender,
        needs_understudy: role.needs_understudy,
      }));
      setLocalRoles(existingAsFormData);
    } else if (roles.length > 0) {
      // No existing roles in database, use roles from parent (if any)
      setLocalRoles(roles);
    }
    setLoading(false);
  };

  const addRole = () => {
    setLocalRoles([
      ...localRoles,
      {
        role_name: '',
        description: null,
        role_type: null,
        gender: null,
        needs_understudy: false,
      },
    ]);
  };

  const updateRole = (index: number, field: keyof RoleFormData, value: any) => {
    const updated = [...localRoles];
    updated[index] = { ...updated[index], [field]: value };
    setLocalRoles(updated);
  };

  const removeRole = (index: number) => {
    const updated = localRoles.filter((_, i) => i !== index);
    setLocalRoles(updated);
  };

  const handleNext = () => {
    // Validate at least one role with a name
    const validRoles = localRoles.filter((role) => role.role_name.trim());

    if (validRoles.length === 0) {
      setError('Please add at least one role with a name');
      return;
    }

    // Generate role operations by comparing current state with existing roles
    const operations: RoleOperation[] = [];

    // Create a map of existing roles by ID for quick lookup
    const existingRolesMap = new Map(existingRoles.map(role => [role.role_id, role]));

    // Create a map of current roles by ID for quick lookup
    const currentRolesMap = new Map(validRoles.map(role => [role.role_id, role]));

    // Find deleted roles (existing roles not in current list)
    existingRoles.forEach(existingRole => {
      if (!currentRolesMap.has(existingRole.role_id)) {
        operations.push({
          type: 'delete',
          roleId: existingRole.role_id,
        });
      }
    });

    // Find new and updated roles
    validRoles.forEach((role) => {
      if (role.role_id) {
        // Existing role - check if it has been modified
        const existingRole = existingRolesMap.get(role.role_id);
        if (existingRole) {
          const hasChanges =
            existingRole.description !== role.description ||
            existingRole.role_type !== role.role_type ||
            existingRole.gender !== role.gender ||
            existingRole.needs_understudy !== role.needs_understudy ||
            existingRole.role_name !== role.role_name;

          if (hasChanges) {
            operations.push({
              type: 'update',
              roleId: role.role_id,
              role: {
                role_name: role.role_name,
                description: role.description,
                role_type: role.role_type,
                gender: role.gender,
                needs_understudy: role.needs_understudy,
              },
            });
          }
        }
      } else {
        // New role
        operations.push({
          type: 'create',
          role: {
            show_id: showId,
            role_name: role.role_name,
            description: role.description,
            role_type: role.role_type,
            gender: role.gender,
            needs_understudy: role.needs_understudy,
          },
        });
      }
    });

    onUpdate(operations);
    onNext();
  };

  const roleTypes: RoleType[] = ['Principal', 'Ensemble', 'Understudy', 'Crew', 'Other'];
  const genderOptions: RoleGender[] = ['masculine', 'feminine', 'ungendered'];

  if (loading) {
    return <div className="text-neu-text-primary">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Manage Roles
        </h2>
        <p className="text-neu-text-primary/70 mb-6">
          Add the roles you need to cast for this show. At least one role is required.
        </p>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {localRoles.map((role, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-neu-surface/50 border border-neu-border space-y-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-neu-text-primary">
                Role {index + 1}
              </h3>
              {localRoles.length > 1 && (
                <button
                  onClick={() => removeRole(index)}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Name */}
              <FormInput
                label="Role Name"
                required
                value={role.role_name}
                onChange={(e) => updateRole(index, 'role_name', e.target.value)}
                placeholder="e.g., Eliza Hamilton"
              />

              {/* Role Type */}
              <FormSelect
                label="Role Type"
                value={role.role_type || ''}
                onChange={(e) =>
                  updateRole(index, 'role_type', e.target.value || null)
                }
              >
                <option value="">Select type...</option>
                {roleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </FormSelect>

              {/* Gender */}
              <FormSelect
                label="Gender"
                value={role.gender || ''}
                onChange={(e) =>
                  updateRole(index, 'gender', e.target.value || null)
                }
              >
                <option value="">Select gender...</option>
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </FormSelect>

              {/* Needs Understudy */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role.needs_understudy || false}
                    onChange={(e) => updateRole(index, 'needs_understudy', e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-neu-surface checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                  />
                  <span className="text-sm font-medium text-neu-text-primary">
                    This role needs an understudy
                  </span>
                </label>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <FormTextarea
                  label="Description"
                  value={role.description || ''}
                  onChange={(e) => updateRole(index, 'description', e.target.value)}
                  placeholder="Describe the role..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Role Button */}
      <button
        onClick={addRole}
        className="text-neu-accent-primary hover:text-neu-accent-secondary transition-colors text-sm font-medium"
      >
        + Add Another Role
      </button>

      {/* Error Message */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={handleNext}
      />
    </div>
  );
}
