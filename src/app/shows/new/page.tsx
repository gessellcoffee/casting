'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShow } from '@/lib/supabase/shows';
import StarryContainer from '@/components/StarryContainer';
import FormInput from '@/components/ui/forms/FormInput';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import Alert from '@/components/ui/feedback/Alert';

export default function NewShowPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showData, setShowData] = useState({
    title: '',
    author: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showData.title.trim()) {
      setError('Show title is required');
      return;
    }

    setCreating(true);
    setError(null);

    const { data, error: createError } = await createShow({
      title: showData.title.trim(),
      author: showData.author.trim() || null,
      description: showData.description.trim() || null,
    });

    if (createError) {
      setError('Failed to create show. Please try again.');
      setCreating(false);
      return;
    }

    if (data) {
      // Redirect to the show detail page or shows list
      router.push(`/shows/${data.show_id}`);
    }
  };

  const handleCancel = () => {
    router.push('/shows');
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <StarryContainer starCount={8} className="card p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
              Create New Show
            </h1>
            <p className="text-neu-text-primary/90 mt-2">
              Add a new show to your collection
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Show Title"
              required
              value={showData.title}
              onChange={(e) => setShowData({ ...showData, title: e.target.value })}
              placeholder="e.g., Hamilton"
              disabled={creating}
              helperText="The name of the show or production"
            />

            <FormInput
              label="Author/Composer"
              value={showData.author}
              onChange={(e) => setShowData({ ...showData, author: e.target.value })}
              placeholder="e.g., Lin-Manuel Miranda"
              disabled={creating}
              helperText="The playwright, composer, or creator (optional)"
            />

            <FormTextarea
              label="Description"
              value={showData.description}
              onChange={(e) => setShowData({ ...showData, description: e.target.value })}
              placeholder="Enter a brief description of the show..."
              rows={5}
              disabled={creating}
              helperText="A brief synopsis or description of the show (optional)"
            />

            {/* Error Message */}
            {error && (
              <Alert variant="error">{error}</Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={creating}
                className="flex-1 px-6 py-3 rounded-xl bg-neu-surface text-neu-text-primary border border-neu-border shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_5px_5px_10px_var(--neu-shadow-dark),inset_-5px_-5px_10px_var(--neu-shadow-light)] hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-300 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !showData.title.trim()}
                className="flex-1 px-6 py-3 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Show'}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 rounded-xl bg-[#5a8ff5]/10 border border-[#5a8ff5]/30">
            <h3 className="text-sm font-medium text-neu-text-primary mb-2">
              💡 What happens next?
            </h3>
            <p className="text-sm text-neu-text-primary/70">
              After creating the show, you can add roles and other details. Shows can be reused 
              as templates when creating auditions, and each audition can customize the roles 
              without affecting the original show.
            </p>
          </div>
        </StarryContainer>
      </div>
    </div>
  );
}
