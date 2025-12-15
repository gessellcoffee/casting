'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import Button from '@/components/Button';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import FormInput from '@/components/ui/forms/FormInput';
import { getUser } from '@/lib/supabase/auth';
import { createCustomForm, deleteCustomForm, getCustomForms, updateCustomForm } from '@/lib/supabase/customForms';
import type { CustomForm, CustomFormStatus } from '@/lib/supabase/types';

function getStatusBadgeClass(status: CustomFormStatus): string {
  if (status === 'published') return 'neu-badge-success';
  if (status === 'archived') return 'neu-badge-danger';
  return 'neu-badge-warning';
}

function getStatusLabel(status: CustomFormStatus): string {
  if (status === 'published') return 'Published';
  if (status === 'archived') return 'Archived';
  return 'Draft';
}

export default function FormsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [newFormName, setNewFormName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const user = await getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const list = await getCustomForms();
    setForms(list);
    setLoading(false);
  };

  const openModal = (title: string, message: string, onConfirmAction?: () => void, confirmText?: string, showCancelBtn: boolean = true) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirmAction) onConfirmAction();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      confirmButtonText: confirmText || 'Confirm',
      showCancel: showCancelBtn,
    });
  };

  const handleCreateForm = async () => {
    const name = newFormName.trim();
    if (!name) return;

    setCreating(true);
    setError(null);

    const { data, error: createError } = await createCustomForm({
      name,
      description: null,
      status: 'draft',
    });

    if (createError || !data) {
      setError(createError?.message || 'Failed to create form');
      setCreating(false);
      return;
    }

    setNewFormName('');
    setCreating(false);
    router.push(`/forms/${data.form_id}`);
  };

  const handleTogglePublish = async (form: CustomForm) => {
    const nextStatus: CustomFormStatus = form.status === 'published' ? 'draft' : 'published';

    const { error: updateError } = await updateCustomForm(form.form_id, {
      status: nextStatus,
    });

    if (updateError) {
      setError(updateError.message || 'Failed to update form');
      return;
    }

    setForms(prev => prev.map(f => (f.form_id === form.form_id ? { ...f, status: nextStatus } : f)));
  };

  const handleDelete = async (form: CustomForm) => {
    openModal(
      'Delete Form',
      `Delete "${form.name}"? This cannot be undone.`,
      async () => {
        const { error: deleteError } = await deleteCustomForm(form.form_id);
        if (deleteError) {
          setError(deleteError.message || 'Failed to delete form');
          return;
        }
        setForms(prev => prev.filter(f => f.form_id !== form.form_id));
      },
      'Delete'
    );
  };

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading forms...</div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        confirmButtonText={modalConfig.confirmButtonText}
        showCancel={modalConfig.showCancel}
      />

      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-neu-text-primary mb-2">Forms</h1>
              <p className="text-neu-text-primary/70">Create and manage custom forms for your productions.</p>
            </div>
          </div>

          <div className="neu-card-raised p-6 rounded-xl mb-6">
            <h2 className="text-lg font-semibold text-neu-text-primary mb-4">Create a new form</h2>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <FormInput
                  label="Form name"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="e.g., Costume Measurements"
                />
              </div>
              <div className="nav-buttons">
                <Button
                  text={creating ? 'Creating...' : 'Create Form'}
                  onClick={handleCreateForm}
                  disabled={creating || !newFormName.trim()}
                />
              </div>
            </div>
            {error && (
              <div className="mt-4 text-sm text-neu-accent-danger">{error}</div>
            )}
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-xl neu-card-raised">
              <div className="text-neu-text-primary/70 mb-4">No forms yet.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <div key={form.form_id} className="neu-card-raised p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-neu-text-primary">{form.name}</h3>
                        <span className={`${getStatusBadgeClass(form.status)} text-xs`}>{getStatusLabel(form.status)}</span>
                      </div>
                      {form.description && (
                        <p className="text-sm text-neu-text-primary/70 mb-2">{form.description}</p>
                      )}
                      <div className="text-xs text-neu-text-primary/60">Updated {new Date(form.updated_at).toLocaleDateString()}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <Link href={`/forms/${form.form_id}`}>
                        <button className="n-button-secondary">Edit</button>
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(form)}
                        className={form.status === 'published' ? 'n-button-secondary' : 'n-button-primary'}
                      >
                        {form.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDelete(form)} className="n-button-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}
