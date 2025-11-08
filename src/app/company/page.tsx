'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import ImageGalleryUpload from '@/components/ImageGalleryUpload';
import { getUser } from '@/lib/supabase';
import { createCompany, getUserCompanies, updateCompany, deleteCompany } from '@/lib/supabase/company';
import type { Company } from '@/lib/supabase/types';
import Button from '@/components/Button';
import AddressInput from '@/components/ui/AddressInput';
import CompanyMembersModal from '@/components/company/CompanyMembersModal';

export default function CompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCompanyForMembers, setSelectedCompanyForMembers] = useState<Company | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    vision: '',
    mission: '',
    values: '',
    image_gallery: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser();
        setUser(userData);

        if (userData?.id) {
          const companiesData = await getUserCompanies(userData.id);
          setCompanies(companiesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      vision: '',
      mission: '',
      values: '',
      image_gallery: [],
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingCompanyId(null);
    setError(null);
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name || '',
      description: company.description || '',
      address: company.address || '',
      vision: company.vision || '',
      mission: company.mission || '',
      values: company.values || '',
      image_gallery: Array.isArray(company.image_gallery) ? (company.image_gallery as string[]) : [],
    });
    setEditingCompanyId(company.company_id);
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isCreating) {
        // Create new company
        const { data, error: createError } = await createCompany({
          name: formData.name,
          description: formData.description || null,
          address: formData.address || null,
          vision: formData.vision || null,
          mission: formData.mission || null,
          values: formData.values || null,
          image_gallery: formData.image_gallery.length > 0 ? formData.image_gallery : null,
        });

        if (createError) {
          throw new Error('Failed to create company');
        }

        // Add new company to the list
        if (data) {
          setCompanies(prev => [data, ...prev]);
        }
        setSuccess('Company created successfully');
      } else if (editingCompanyId) {
        // Update existing company
        const { data, error: updateError } = await updateCompany(editingCompanyId, {
          name: formData.name,
          description: formData.description || null,
          address: formData.address || null,
          vision: formData.vision || null,
          mission: formData.mission || null,
          values: formData.values || null,
          image_gallery: formData.image_gallery.length > 0 ? formData.image_gallery : null,
        });

        if (updateError) {
          throw new Error('Failed to update company');
        }

        // Update company in the list
        if (data) {
          setCompanies(prev => prev.map(c => c.company_id === editingCompanyId ? data : c));
        }
        setSuccess('Company updated successfully');
      }

      resetForm();
      setIsCreating(false);
      setEditingCompanyId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteError } = await deleteCompany(companyId);

      if (deleteError) {
        throw new Error('Failed to delete company');
      }

      // Remove company from the list
      setCompanies(prev => prev.filter(c => c.company_id !== companyId));
      setSuccess('Company deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsCreating(false);
    setEditingCompanyId(null);
    setError(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-4xl">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
                My Companies
              </h1>
              
              {!isCreating && !editingCompanyId && (
                <div className="nav-buttons">
                  <Button 
                    onClick={handleCreate}
                    text="Create Company"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
                {success}
              </div>
            )}

            {loading ? (
              <div className="text-neu-text-primary/90">Loading companies...</div>
            ) : (
              <div className="space-y-6">
                {/* Create/Edit Form */}
                {(isCreating || editingCompanyId) && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold text-neu-text-primary">
                        {isCreating ? 'Create New Company' : 'Edit Company'}
                      </h2>
                      <div className="nav-buttons">
                        <Button
                          onClick={handleCancel}
                          disabled={saving}
                          text="Cancel"
                        />
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          text={saving ? 'Saving...' : 'Save'}
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="neu-input"
                        placeholder="Enter company name"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="neu-input"
                        placeholder="Brief description of your company"
                      />
                    </div>

                    {/* Address */}
                    <AddressInput
                      label="Address"
                      value={formData.address}
                      onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                      placeholder="Company address"
                    />

                    {/* Vision */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                        Vision
                      </label>
                      <textarea
                        name="vision"
                        value={formData.vision}
                        onChange={handleInputChange}
                        rows={2}
                        className="neu-input"
                        placeholder="Your company's vision"
                      />
                    </div>

                    {/* Mission */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                        Mission
                      </label>
                      <textarea
                        name="mission"
                        value={formData.mission}
                        onChange={handleInputChange}
                        rows={2}
                        className="neu-input"
                        placeholder="Your company's mission"
                      />
                    </div>

                    {/* Values */}
                    <div>
                      <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                        Values
                      </label>
                      <textarea
                        name="values"
                        value={formData.values}
                        onChange={handleInputChange}
                        rows={2}
                        className=" neu-input"
                        placeholder="Your company's core values"
                      />
                    </div>

                    {/* Image Gallery */}
                    {user?.id && (
                      <div>
                        <ImageGalleryUpload
                          userId={user.id}
                          images={formData.image_gallery}
                          onImagesChange={(images) => setFormData(prev => ({ ...prev, image_gallery: images }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Companies List */}
                {!isCreating && !editingCompanyId && (
                  <div className="space-y-4">
                    {companies.length === 0 ? (
                      <div className="text-center py-12 text-neu-text-primary/70">
                        <p className="text-lg mb-4">You haven't created any companies yet.</p>
                        <Button onClick={handleCreate} text="Create Your First Company" />
                      </div>
                    ) : (
                      companies.map((company) => (
                        <div
                          key={company.company_id}
                          className="p-6 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-semibold text-neu-text-primary mb-2">
                                {company.name}
                              </h3>
                              {company.description && (
                                <p className="text-neu-text-primary/80">{company.description}</p>
                              )}
                            </div>
                            <div className="nav-buttons">
                              <Button
                                onClick={() => setSelectedCompanyForMembers(company)}
                                text="Manage Members"
                              />
                              <Button
                                onClick={() => handleEdit(company)}
                                text="Edit"
                              />
                              <Button
                                onClick={() => handleDelete(company.company_id)}
                                text="Delete"
                                disabled={saving}
                              />
                            </div>
                          </div>

                          {company.address && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-neu-text-primary/70">Address: </span>
                              <span className="text-neu-text-primary">{company.address}</span>
                            </div>
                          )}

                          {company.vision && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-neu-text-primary/70">Vision: </span>
                              <span className="text-neu-text-primary">{company.vision}</span>
                            </div>
                          )}

                          {company.mission && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-neu-text-primary/70">Mission: </span>
                              <span className="text-neu-text-primary">{company.mission}</span>
                            </div>
                          )}

                          {company.values && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-neu-text-primary/70">Values: </span>
                              <span className="text-neu-text-primary">{company.values}</span>
                            </div>
                          )}

                          {company.image_gallery && Array.isArray(company.image_gallery) && company.image_gallery.length > 0 && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                                Gallery
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(company.image_gallery as string[]).map((url, index) => (
                                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-neu-border">
                                    <img
                                      src={url}
                                      alt={`${company.name} gallery image ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </StarryContainer>
      </div>

      {/* Company Members Modal */}
      {selectedCompanyForMembers && user?.id && (
        <CompanyMembersModal
          companyId={selectedCompanyForMembers.company_id}
          companyName={selectedCompanyForMembers.name}
          currentUserId={user.id}
          onClose={() => setSelectedCompanyForMembers(null)}
        />
      )}
    </ProtectedRoute>
  );
}
