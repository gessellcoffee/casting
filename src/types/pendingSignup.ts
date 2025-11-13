// =============================================
// PENDING SIGNUP TYPES
// =============================================

export type PendingSignupRequestType = 
  | 'casting_offer' 
  | 'company_member' 
  | 'callback_invitation';

// Base pending signup row from database
export interface PendingSignupRow {
  pending_signup_id: string;
  email: string;
  request_type: PendingSignupRequestType;
  request_data: Record<string, any>;
  invited_by: string;
  invitation_sent_at: string;
  expires_at: string;
  completed_at: string | null;
  completed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

// Request data structures for each type
export interface CastingOfferRequestData {
  audition_id: string;
  role_id?: string;
  audition_role_id?: string;
  is_understudy: boolean;
  offer_message: string;
  show_title: string;
  role_name: string;
}

export interface CompanyMemberRequestData {
  company_id: string;
  role: 'Member' | 'Viewer' | 'Admin';
  company_name: string;
}

export interface CallbackInvitationRequestData {
  audition_id: string;
  callback_date: string;
  callback_time: string;
  show_title: string;
  location?: string;
  notes?: string;
}

// Insert type for creating new pending signups
export interface PendingSignupInsert {
  email: string;
  request_type: PendingSignupRequestType;
  request_data: CastingOfferRequestData | CompanyMemberRequestData | CallbackInvitationRequestData;
  invited_by: string;
}

// Extended type with inviter profile info
export interface PendingSignupWithInviter extends PendingSignupRow {
  inviter_profile?: {
    username: string;
    full_name: string | null;
    profile_photo_url: string | null;
  };
}

// Statistics for pending signups
export interface PendingSignupStats {
  total_sent: number;
  total_completed: number;
  total_cancelled: number;
  total_expired: number;
  total_active: number;
  by_type: {
    casting_offer: number;
    company_member: number;
    callback_invitation: number;
  };
}
