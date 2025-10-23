'use client';

import { useEffect, useState } from 'react';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getUser } from '@/lib/supabase';
import { getUserPendingApprovalRequests, updateApprovalRequest } from '@/lib/supabase/companyApprovals';
import Button from '@/components/Button';

interface ApprovalRequestWithDetails {
  request_id: string;
  resume_entry_id: string;
  company_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_resume: {
    show_name: string | null;
    role: string | null;
    date_of_production: string | null;
  };
  profiles: {
    first_name: string | null;
    last_name: string | null;
    username: string;
    profile_photo_url: string | null;
  };
  companies: {
    name: string;
  };
}

export default function ApprovalsPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<ApprovalRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser();
        setUser(userData);

        if (userData?.id) {
          const requestsData = await getUserPendingApprovalRequests();
          setRequests(requestsData as ApprovalRequestWithDetails[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load approval requests');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    setError(null);
    setSuccess(null);

    try {
      const { error: approveError } = await updateApprovalRequest(requestId, 'approved');

      if (approveError) {
        throw new Error('Failed to approve request');
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
      setSuccess('Request approved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this request?')) {
      return;
    }

    setProcessing(requestId);
    setError(null);
    setSuccess(null);

    try {
      const { error: rejectError } = await updateApprovalRequest(requestId, 'rejected');

      if (rejectError) {
        throw new Error('Failed to reject request');
      }

      // Remove from list
      setRequests(prev => prev.filter(r => r.request_id !== requestId));
      setSuccess('Request rejected');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <StarryContainer starCount={15} className="card w-full max-w-4xl">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] pb-2">
                Company Approvals
              </h1>
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
              <div className="text-neu-text-primary/90">Loading approval requests...</div>
            ) : (
              <div className="space-y-6">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-neu-text-primary/70">
                    <p className="text-lg mb-2">No pending approval requests</p>
                    <p className="text-sm text-neu-text-primary/50">
                      When users add your company to their resume, you'll see requests here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.request_id}
                        className="p-6 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            {/* User Avatar */}
                            <div className="flex-shrink-0">
                              {request.profiles.profile_photo_url ? (
                                <img
                                  src={request.profiles.profile_photo_url}
                                  alt="Profile"
                                  className="w-12 h-12 rounded-full border-2 border-neu-border object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full border-2 border-neu-border bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-[#4a7bd9]/50" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Request Details */}
                            <div className="flex-1">
                              <div className="mb-2">
                                <span className="text-neu-text-primary font-semibold">
                                  {request.profiles.first_name && request.profiles.last_name
                                    ? `${request.profiles.first_name} ${request.profiles.last_name}`
                                    : request.profiles.username}
                                </span>
                                <span className="text-neu-text-primary/70"> wants to add </span>
                                <span className="text-neu-accent-primary font-semibold">{request.companies.name}</span>
                                <span className="text-neu-text-primary/70"> to their resume</span>
                              </div>

                              {/* Production Details */}
                              <div className="space-y-1 text-sm text-neu-text-primary/80">
                                {request.user_resume.show_name && (
                                  <p>
                                    <span className="text-neu-text-primary/60">Show: </span>
                                    {request.user_resume.show_name}
                                  </p>
                                )}
                                {request.user_resume.role && (
                                  <p>
                                    <span className="text-neu-text-primary/60">Role: </span>
                                    {request.user_resume.role}
                                  </p>
                                )}
                                {request.user_resume.date_of_production && (
                                  <p>
                                    <span className="text-neu-text-primary/60">Date: </span>
                                    {request.user_resume.date_of_production}
                                  </p>
                                )}
                              </div>

                              {/* Request Date */}
                              <p className="text-xs text-neu-text-primary/50 mt-2">
                                Requested {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="nav-buttons flex-shrink-0">
                            <Button
                              onClick={() => handleReject(request.request_id)}
                              disabled={processing === request.request_id}
                              text={processing === request.request_id ? 'Processing...' : 'Reject'}
                            />
                            <Button
                              onClick={() => handleApprove(request.request_id)}
                              disabled={processing === request.request_id}
                              text={processing === request.request_id ? 'Processing...' : 'Approve'}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </StarryContainer>
      </div>
    </ProtectedRoute>
  );
}
