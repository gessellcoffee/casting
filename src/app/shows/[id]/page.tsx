'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getShow, updateShow } from '@/lib/supabase/shows';
import { getShowRoles, createRole, updateRole, deleteRole } from '@/lib/supabase/roles';
import { supabase } from '@/lib/supabase/client';
import type { Show, Role, RoleInsert, RoleUpdate, RoleType, RoleGender } from '@/lib/supabase/types';

export default function ShowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const showId = params.id as string;

  const [show, setShow] = useState<Show | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<RoleInsert | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadCurrentUser();
    loadShowData();
  }, [showId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadShowData = async () => {
    setLoading(true);
    
    const showData = await getShow(showId);
    if (!showData) {
      router.push('/shows');
      return;
    }
    
    setShow(showData);
    setTitle(showData.title);
    setAuthor(showData.author || '');
    setDescription(showData.description || '');
    
    const rolesData = await getShowRoles(showId);
    setRoles(rolesData);
    
    setLoading(false);
  };

  const canManageShow = () => {
    return currentUserId && show?.creator_user_id === currentUserId;
  };

  const handleSaveShow = async () => {
    if (!show) return;
    
    setSaving(true);
    const { error } = await updateShow(showId, {
      title,
      author: author || null,
      description: description || null,
    });
    
    if (error) {
      alert(`Error updating show: ${error.message}`);
      setSaving(false);
      return;
    }
    
    setEditMode(false);
    setSaving(false);
    loadShowData();
  };

  const handleAddRole = () => {
    setNewRole({
      show_id: showId,
      role_name: '',
      description: null,
      role_type: null,
      gender: null,
      needs_understudy: false,
    });
  };

  const handleSaveNewRole = async () => {
    if (!newRole || !newRole.role_name.trim()) {
      alert('Role name is required');
      return;
    }
    
    setSaving(true);
    const { error } = await createRole(newRole);
    
    if (error) {
      alert(`Error creating role: ${error.message}`);
      setSaving(false);
      return;
    }
    
    setNewRole(null);
    setSaving(false);
    loadShowData();
  };

  const handleUpdateRole = async (roleId: string, updates: RoleUpdate) => {
    setSaving(true);
    const { error } = await updateRole(roleId, updates);
    
    if (error) {
      alert(`Error updating role: ${error.message}`);
      setSaving(false);
      return;
    }
    
    setEditingRole(null);
    setSaving(false);
    loadShowData();
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    setSaving(true);
    const { error } = await deleteRole(roleId);
    
    if (error) {
      alert(`Error deleting role: ${error.message}`);
      setSaving(false);
      return;
    }
    
    setSaving(false);
    loadShowData();
  };

  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedRoles(new Set());
  };

  const handleToggleRole = (roleId: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRoles.size === roles.length) {
      setSelectedRoles(new Set());
    } else {
      setSelectedRoles(new Set(roles.map(r => r.role_id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRoles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRoles.size} role(s)?`)) return;
    
    setSaving(true);
    
    // Delete all selected roles
    const deletePromises = Array.from(selectedRoles).map(roleId => deleteRole(roleId));
    const results = await Promise.all(deletePromises);
    
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      alert(`Error deleting ${errors.length} role(s)`);
    }
    
    setSelectedRoles(new Set());
    setSelectMode(false);
    setSaving(false);
    loadShowData();
  };

  const roleTypes: RoleType[] = ['Principal', 'Ensemble', 'Understudy', 'Crew', 'Other'];
  const genderOptions: RoleGender[] = ['masculine', 'feminine', 'ungendered'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#243447] to-[#2e3e5e] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a8ff5]"></div>
          <p className="mt-4 text-[#c5ddff]/70">Loading show...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#243447] to-[#2e3e5e] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/shows"
            className="inline-flex items-center gap-2 text-[#5a8ff5] hover:text-[#94b0f6] transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shows
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-[#c5ddff] mb-2">{show.title}</h1>
              {show.author && (
                <p className="text-lg text-[#c5ddff]/60">by {show.author}</p>
              )}
            </div>
            {canManageShow() && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="n-button-primary px-6 py-3 rounded-xl bg-gradient-to-br from-[#4a7bd9] to-[#3d5fa8] text-white border border-[#5a8ff5]/30 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)] transition-all duration-300 font-medium"
              >
                Edit Show
              </button>
            )}
          </div>
        </div>

        {/* Show Details Section */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
          <h2 className="text-2xl font-semibold text-[#c5ddff] mb-4">Show Information</h2>
          
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveShow}
                  disabled={saving || !title.trim()}
                  className="n-button-primary px-6 py-3 rounded-xl bg-gradient-to-br from-[#4a7bd9] to-[#3d5fa8] text-white border border-[#5a8ff5]/30 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setTitle(show.title);
                    setAuthor(show.author || '');
                    setDescription(show.description || '');
                  }}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] text-[#b5ccff] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {show.description && (
                <div>
                  <h3 className="text-sm font-medium text-[#b5ccff] mb-1">Description</h3>
                  <p className="text-[#c5ddff]/80">{show.description}</p>
                </div>
              )}
              <div className="flex gap-6 text-sm text-[#c5ddff]/60">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(show.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Roles:</span> {roles.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Roles Section */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#c5ddff]">Roles</h2>
            {canManageShow() && !newRole && (
              <div className="flex gap-2">
                {!selectMode ? (
                  <>
                    <button
                      onClick={handleAddRole}
                      className="n-button-primary px-4 py-2 rounded-lg"
                    >
                      + Add Role
                    </button>
                    {roles.length > 0 && (
                      <button
                        onClick={handleToggleSelectMode}
                        className="n-button-primary px-4 py-2 rounded-lg disabled:cursor-not-allowed"
                      >
                        Select
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="n-button-primary px-4 py-2 rounded-lg disabled:cursor-not-allowed"
                    >
                      {selectedRoles.size === roles.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedRoles.size === 0 || saving}
                      className="n-button-danger px-4 py-2 rounded-lg disabled:cursor-not-allowed"
                    >
                      Delete ({selectedRoles.size})
                    </button>
                    <button
                      onClick={handleToggleSelectMode}
                      disabled={saving}
                      className="n-button-secondary px-4 py-2 rounded-lg disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* New Role Form */}
          {newRole && (
            <div className="mb-6 p-4 rounded-xl bg-[#1a2332]/50 border border-[#4a7bd9]/30">
              <h3 className="text-lg font-medium text-[#c5ddff] mb-4">New Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                    Role Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRole.role_name}
                    onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
                    placeholder="e.g., Eliza Hamilton"
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                    Role Type
                  </label>
                  <select
                    value={newRole.role_type || ''}
                    onChange={(e) => setNewRole({ ...newRole, role_type: (e.target.value as RoleType) || null })}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
                  >
                    <option value="">Select type...</option>
                    {roleTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                    Gender
                  </label>
                  <select
                    value={newRole.gender || ''}
                    onChange={(e) => setNewRole({ ...newRole, gender: (e.target.value as RoleGender) || null })}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
                  >
                    <option value="">Select gender...</option>
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRole.needs_understudy || false}
                      onChange={(e) => setNewRole({ ...newRole, needs_understudy: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-[#2e3e5e] checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
                    />
                    <span className="text-sm font-medium text-[#b5ccff]">
                      This role needs an understudy
                    </span>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#b5ccff] mb-2">
                    Description
                  </label>
                  <textarea
                    value={newRole.description || ''}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value || null })}
                    placeholder="Describe the role..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveNewRole}
                  disabled={saving || !newRole.role_name.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-br from-[#4a7bd9] to-[#3d5fa8] text-white text-sm font-medium border border-[#5a8ff5]/30 hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Role'}
                </button>
                <button
                  onClick={() => setNewRole(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#2e3e5e] text-[#c5ddff] text-sm font-medium border border-[#4a7bd9]/20 hover:border-[#5a8ff5]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Roles List */}
          {roles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎭</div>
              <p className="text-[#c5ddff]/70">No roles added yet</p>
              {canManageShow() && (
                <p className="text-[#c5ddff]/50 text-sm mt-2">
                  Click "Add Role" to create your first role
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <RoleCard
                  key={role.role_id}
                  role={role}
                  isEditing={editingRole === role.role_id}
                  canManage={!!canManageShow()}
                  saving={saving}
                  roleTypes={roleTypes}
                  genderOptions={genderOptions}
                  selectMode={selectMode}
                  isSelected={selectedRoles.has(role.role_id)}
                  onToggleSelect={() => handleToggleRole(role.role_id)}
                  onEdit={() => setEditingRole(role.role_id)}
                  onCancelEdit={() => setEditingRole(null)}
                  onSave={(updates) => handleUpdateRole(role.role_id, updates)}
                  onDelete={() => handleDeleteRole(role.role_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Role Card Component
interface RoleCardProps {
  role: Role;
  isEditing: boolean;
  canManage: boolean;
  saving: boolean;
  roleTypes: RoleType[];
  genderOptions: RoleGender[];
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: RoleUpdate) => void;
  onDelete: () => void;
}

function RoleCard({
  role,
  isEditing,
  canManage,
  saving,
  roleTypes,
  genderOptions,
  selectMode,
  isSelected,
  onToggleSelect,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: RoleCardProps) {
  const [editData, setEditData] = useState<RoleUpdate>({
    role_name: role.role_name,
    description: role.description,
    role_type: role.role_type,
    gender: role.gender,
    needs_understudy: role.needs_understudy,
  });

  useEffect(() => {
    if (isEditing) {
      setEditData({
        role_name: role.role_name,
        description: role.description,
        role_type: role.role_type,
        gender: role.gender,
        needs_understudy: role.needs_understudy,
      });
    }
  }, [isEditing, role]);

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl bg-[#1a2332]/50 border border-[#4a7bd9]/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[#b5ccff] mb-2">
              Role Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={editData.role_name}
              onChange={(e) => setEditData({ ...editData, role_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#b5ccff] mb-2">
              Role Type
            </label>
            <select
              value={editData.role_type || ''}
              onChange={(e) => setEditData({ ...editData, role_type: (e.target.value as RoleType) || null })}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
            >
              <option value="">Select type...</option>
              {roleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#b5ccff] mb-2">
              Gender
            </label>
            <select
              value={editData.gender || ''}
              onChange={(e) => setEditData({ ...editData, gender: (e.target.value as RoleGender) || null })}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all"
            >
              <option value="">Select gender...</option>
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.needs_understudy || false}
                onChange={(e) => setEditData({ ...editData, needs_understudy: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-[#2e3e5e] checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
              />
              <span className="text-sm font-medium text-[#b5ccff]">
                This role needs an understudy
              </span>
            </label>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#b5ccff] mb-2">
              Description
            </label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value || null })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#4a7bd9]/20 text-[#c5ddff] placeholder-[#c5ddff]/40 focus:outline-none focus:border-[#5a8ff5]/50 focus:ring-2 focus:ring-[#5a8ff5]/20 transition-all resize-none"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => onSave(editData)}
            disabled={saving || !editData.role_name?.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-br from-[#4a7bd9] to-[#3d5fa8] text-white text-sm font-medium border border-[#5a8ff5]/30 hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onCancelEdit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#2e3e5e] text-[#c5ddff] text-sm font-medium border border-[#4a7bd9]/20 hover:border-[#5a8ff5]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-[#1a2332]/30 border transition-all ${
      selectMode && isSelected 
        ? 'border-[#5a8ff5] bg-[#5a8ff5]/10' 
        : 'border-[#4a7bd9]/20 hover:border-[#5a8ff5]/30'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3 flex-1">
          {selectMode && (
            <label className="flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-5 h-5 rounded border-2 border-[#4a7bd9] bg-[#2e3e5e] checked:bg-[#5a8ff5] checked:border-[#5a8ff5] focus:outline-none focus:ring-2 focus:ring-[#5a8ff5]/50 cursor-pointer transition-all"
              />
            </label>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-[#c5ddff]">{role.role_name}</h3>
              {role.needs_understudy && (
                <span className="px-2 py-0.5 rounded-md bg-[#5a8ff5]/20 border border-[#5a8ff5]/40 text-[#5a8ff5] text-xs font-medium">
                  + Understudy
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-sm text-[#c5ddff]/60">
              {role.role_type && <span className="capitalize">{role.role_type}</span>}
              {role.gender && <span className="capitalize">{role.gender}</span>}
            </div>
          </div>
        </div>
        {canManage && !selectMode && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 rounded-lg text-[#5a8ff5] hover:bg-[#5a8ff5]/10 transition-all text-sm"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      {role.description && (
        <p className="text-[#c5ddff]/70 text-sm">{role.description}</p>
      )}
    </div>
  );
}
