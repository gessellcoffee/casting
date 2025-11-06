import { User, Session } from '@supabase/supabase-js';

// Re-export Supabase types for convenience
export type { User, Session };

// Database types - extend this as your database schema grows
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          middle_name: string | null;
          last_name: string | null;
          profile_photo_url: string | null;
          description: string | null;
          resume_url: string | null;
          image_gallery: any | null; // JSONB
          video_gallery: any | null; // JSONB
          skills: string[] | null; // JSONB array of skill names
          education: any | null; // JSONB
          preferences: any | null; // JSONB
          location: string | null;
          location_lat: number | null;
          location_lng: number | null;
          created_at: string;
          email: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          profile_photo_url?: string | null;
          description?: string | null;
          resume_url?: string | null;
          image_gallery?: any | null;
          video_gallery?: any | null;
          skills?: string[] | null;
          education?: any | null;
          preferences?: any | null;
          location?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          created_at?: string;
          email: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          profile_photo_url?: string | null;
          description?: string | null;
          resume_url?: string | null;
          image_gallery?: any | null;
          video_gallery?: any | null;
          skills?: string[] | null;
          education?: any | null;
          preferences?: any | null;
          location?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          created_at?: string;
          email?: string;
        };
        Relationships: [];
      };
      user_resume: {
        Row: {
          resume_entry_id: string;
          user_id: string;
          company_name: string | null;
          company_id: string | null;
          show_name: string | null;
          role: string | null;
          date_of_production: string | null;
          source: Database['public']['Enums']['resume_source_enum'];
          company_approved: boolean | null;
        };
        Insert: {
          resume_entry_id?: string;
          user_id: string;
          company_name?: string | null;
          company_id?: string | null;
          show_name?: string | null;
          role?: string | null;
          date_of_production?: string | null;
          source?: Database['public']['Enums']['resume_source_enum'];
          company_approved?: boolean | null;
        };
        Update: {
          resume_entry_id?: string;
          user_id?: string;
          company_name?: string | null;
          company_id?: string | null;
          show_name?: string | null;
          role?: string | null;
          date_of_production?: string | null;
          source?: Database['public']['Enums']['resume_source_enum'];
          company_approved?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_resume_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_resume_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['company_id'];
          }
        ];
      };
      companies: {
        Row: {
          company_id: string;
          creator_user_id: string;
          name: string;
          description: string | null;
          address: string | null;
          vision: string | null;
          mission: string | null;
          values: string | null;
          image_gallery: any | null; // JSONB
          created_at: string;
        };
        Insert: {
          company_id?: string;
          creator_user_id?: string;
          name: string;
          description?: string | null;
          address?: string | null;
          vision?: string | null;
          mission?: string | null;
          values?: string | null;
          image_gallery?: any | null;
          created_at?: string;
        };
        Update: {
          company_id?: string;
          creator_user_id?: string;
          name?: string;
          description?: string | null;
          address?: string | null;
          vision?: string | null;
          mission?: string | null;
          values?: string | null;
          image_gallery?: any | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'companies_creator_user_id_fkey';
            columns: ['creator_user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      company_approval_requests: {
        Row: {
          request_id: string;
          resume_entry_id: string;
          company_id: string;
          user_id: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          request_id?: string;
          resume_entry_id: string;
          company_id: string;
          user_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          request_id?: string;
          resume_entry_id?: string;
          company_id?: string;
          user_id?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_approval_requests_resume_entry_id_fkey';
            columns: ['resume_entry_id'];
            referencedRelation: 'user_resume';
            referencedColumns: ['resume_entry_id'];
          },
          {
            foreignKeyName: 'company_approval_requests_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'company_approval_requests_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      company_members: {
        Row: {
          member_id: string;
          company_id: string;
          user_id: string;
          role: 'owner' | 'moderator' | 'admin' | 'member' | 'viewer';
          invited_by: string | null;
          invited_at: string;
          joined_at: string;
          status: 'active' | 'inactive' | 'pending';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          member_id?: string;
          company_id: string;
          user_id: string;
          role?: 'owner' | 'moderator' | 'admin' | 'member' | 'viewer';
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          member_id?: string;
          company_id?: string;
          user_id?: string;
          role?: 'owner' | 'moderator' | 'admin' | 'member' | 'viewer';
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_members_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['company_id'];
          },
          {
            foreignKeyName: 'company_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_invited_by_fkey';
            columns: ['invited_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          notification_id: string;
          recipient_id: string;
          sender_id: string | null;
          type: 'company_approval' | 'user_affiliation' | 'casting_decision' | 'casting_offer' | 'general';
          title: string;
          message: string;
          action_url: string | null;
          reference_id: string | null;
          reference_type: string | null;
          is_read: boolean;
          is_actionable: boolean;
          action_taken: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          notification_id?: string;
          recipient_id: string;
          sender_id?: string | null;
          type: 'company_approval' | 'user_affiliation' | 'casting_decision' | 'casting_offer' | 'general';
          title: string;
          message: string;
          action_url?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          is_actionable?: boolean;
          action_taken?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          notification_id?: string;
          recipient_id?: string;
          sender_id?: string | null;
          type?: 'company_approval' | 'user_affiliation' | 'casting_decision' | 'casting_offer' | 'general';
          title?: string;
          message?: string;
          action_url?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          is_actionable?: boolean;
          action_taken?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      shows: {
        Row: {
          show_id: string;
          title: string;
          author: string | null;
          description: string | null;
          creator_user_id: string | null;
          created_at: string;
        };
        Insert: {
          show_id?: string;
          title: string;
          author?: string | null;
          description?: string | null;
          creator_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          show_id?: string;
          title?: string;
          author?: string | null;
          description?: string | null;
          creator_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shows_creator_user_id_fkey';
            columns: ['creator_user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      roles: {
        Row: {
          role_id: string;
          show_id: string;
          role_name: string;
          description: string | null;
          role_type: Database['public']['Enums']['role_type_enum'] | null;
          gender: Database['public']['Enums']['role_genders'] | null;
          needs_understudy: boolean;
        };
        Insert: {
          role_id?: string;
          show_id: string;
          role_name: string;
          description?: string | null;
          role_type?: Database['public']['Enums']['role_type_enum'] | null;
          gender?: Database['public']['Enums']['role_genders'] | null;
          needs_understudy?: boolean;
        };
        Update: {
          role_id?: string;
          show_id?: string;
          role_name?: string;
          description?: string | null;
          role_type?: Database['public']['Enums']['role_type_enum'] | null;
          gender?: Database['public']['Enums']['role_genders'] | null;
          needs_understudy?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'roles_show_id_fkey';
            columns: ['show_id'];
            referencedRelation: 'shows';
            referencedColumns: ['show_id'];
          }
        ];
      };
      auditions: {
        Row: {
          audition_id: string;
          show_id: string;
          user_id: string;
          company_id: string | null;
          audition_dates: any | null; // JSONB array of date strings
          audition_location: string | null;
          rehearsal_dates: string | null;
          rehearsal_location: string | null;
          performance_dates: string | null;
          performance_location: string | null;
          ensemble_size: number | null;
          equity_status: Database['public']['Enums']['equity_status_enum'] | null;
          show_filled_slots: boolean | null;
          created_at: string;
        };
        Insert: {
          audition_id?: string;
          show_id: string;
          user_id: string;
          company_id?: string | null;
          audition_dates?: any | null;
          audition_location?: string | null;
          rehearsal_dates?: string | null;
          rehearsal_location?: string | null;
          performance_dates?: string | null;
          performance_location?: string | null;
          ensemble_size?: number | null;
          equity_status?: Database['public']['Enums']['equity_status_enum'] | null;
          show_filled_slots?: boolean | null;
          created_at?: string;
        };
        Update: {
          audition_id?: string;
          show_id?: string;
          user_id?: string;
          company_id?: string | null;
          audition_dates?: any | null;
          audition_location?: string | null;
          rehearsal_dates?: string | null;
          rehearsal_location?: string | null;
          performance_dates?: string | null;
          performance_location?: string | null;
          ensemble_size?: number | null;
          equity_status?: Database['public']['Enums']['equity_status_enum'] | null;
          show_filled_slots?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'auditions_show_id_fkey';
            columns: ['show_id'];
            referencedRelation: 'shows';
            referencedColumns: ['show_id'];
          },
          {
            foreignKeyName: 'auditions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auditions_company_id_fkey';
            columns: ['company_id'];
            referencedRelation: 'companies';
            referencedColumns: ['company_id'];
          }
        ];
      };
      audition_slots: {
        Row: {
          slot_id: string;
          audition_id: string;
          start_time: string;
          end_time: string;
          location: string | null;
          max_signups: number | null;
        };
        Insert: {
          slot_id?: string;
          audition_id: string;
          start_time: string;
          end_time: string;
          location?: string | null;
          max_signups?: number | null;
        };
        Update: {
          slot_id?: string;
          audition_id?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          max_signups?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audition_slots_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          }
        ];
      };
      audition_signups: {
        Row: {
          signup_id: string;
          slot_id: string;
          user_id: string;
          role_id: string | null;
          status: Database['public']['Enums']['signup_status_enum'] | null;
          created_at: string;
        };
        Insert: {
          signup_id?: string;
          slot_id: string;
          user_id: string;
          role_id?: string | null;
          status?: Database['public']['Enums']['signup_status_enum'] | null;
          created_at?: string;
        };
        Update: {
          signup_id?: string;
          slot_id?: string;
          user_id?: string;
          role_id?: string | null;
          status?: Database['public']['Enums']['signup_status_enum'] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audition_signups_slot_id_fkey';
            columns: ['slot_id'];
            referencedRelation: 'audition_slots';
            referencedColumns: ['slot_id'];
          },
          {
            foreignKeyName: 'audition_signups_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audition_signups_role_id_fkey';
            columns: ['role_id'];
            referencedRelation: 'roles';
            referencedColumns: ['role_id'];
          }
        ];
      };
      audition_roles: {
        Row: {
          audition_role_id: string;
          audition_id: string;
          role_id: string | null;
          role_name: string;
          description: string | null;
          role_type: Database['public']['Enums']['role_type_enum'] | null;
          gender: Database['public']['Enums']['role_genders'] | null;
          needs_understudy: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          audition_role_id?: string;
          audition_id: string;
          role_id?: string | null;
          role_name: string;
          description?: string | null;
          role_type?: Database['public']['Enums']['role_type_enum'] | null;
          gender?: Database['public']['Enums']['role_genders'] | null;
          needs_understudy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          audition_role_id?: string;
          audition_id?: string;
          role_id?: string | null;
          role_name?: string;
          description?: string | null;
          role_type?: Database['public']['Enums']['role_type_enum'] | null;
          gender?: Database['public']['Enums']['role_genders'] | null;
          needs_understudy?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audition_roles_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          },
          {
            foreignKeyName: 'audition_roles_role_id_fkey';
            columns: ['role_id'];
            referencedRelation: 'roles';
            referencedColumns: ['role_id'];
          }
        ];
      };
      cast_members: {
        Row: {
          cast_member_id: string;
          audition_id: string;
          user_id: string;
          role_id: string | null;
          audition_role_id: string | null;
          status: Database['public']['Enums']['cast_status_enum'] | null;
          is_understudy: boolean;
        };
        Insert: {
          cast_member_id?: string;
          audition_id: string;
          user_id: string;
          role_id?: string | null;
          audition_role_id?: string | null;
          status?: Database['public']['Enums']['cast_status_enum'] | null;
          is_understudy?: boolean;
        };
        Update: {
          cast_member_id?: string;
          audition_id?: string;
          user_id?: string;
          role_id?: string | null;
          audition_role_id?: string | null;
          status?: Database['public']['Enums']['cast_status_enum'] | null;
          is_understudy?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'cast_members_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          },
          {
            foreignKeyName: 'cast_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cast_members_role_id_fkey';
            columns: ['role_id'];
            referencedRelation: 'roles';
            referencedColumns: ['role_id'];
          },
          {
            foreignKeyName: 'cast_members_audition_role_id_fkey';
            columns: ['audition_role_id'];
            referencedRelation: 'audition_roles';
            referencedColumns: ['audition_role_id'];
          }
        ];
      };
      callback_slots: {
        Row: {
          callback_slot_id: string;
          audition_id: string;
          start_time: string;
          end_time: string;
          location: string | null;
          max_signups: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          callback_slot_id?: string;
          audition_id: string;
          start_time: string;
          end_time: string;
          location?: string | null;
          max_signups?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          callback_slot_id?: string;
          audition_id?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          max_signups?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'callback_slots_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          }
        ];
      };
      callback_invitations: {
        Row: {
          invitation_id: string;
          callback_slot_id: string;
          signup_id: string;
          user_id: string;
          audition_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          actor_comment: string | null;
          casting_notes: string | null;
          invited_at: string;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          invitation_id?: string;
          callback_slot_id: string;
          signup_id: string;
          user_id: string;
          audition_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          actor_comment?: string | null;
          casting_notes?: string | null;
          invited_at?: string;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          invitation_id?: string;
          callback_slot_id?: string;
          signup_id?: string;
          user_id?: string;
          audition_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          actor_comment?: string | null;
          casting_notes?: string | null;
          invited_at?: string;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'callback_invitations_callback_slot_id_fkey';
            columns: ['callback_slot_id'];
            referencedRelation: 'callback_slots';
            referencedColumns: ['callback_slot_id'];
          },
          {
            foreignKeyName: 'callback_invitations_signup_id_fkey';
            columns: ['signup_id'];
            referencedRelation: 'audition_signups';
            referencedColumns: ['signup_id'];
          },
          {
            foreignKeyName: 'callback_invitations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'callback_invitations_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          }
        ];
      };
      production_team_members: {
        Row: {
          production_team_member_id: string;
          audition_id: string;
          user_id: string | null;
          role_title: string;
          invited_email: string | null;
          status: 'pending' | 'active' | 'declined';
          invited_by: string | null;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          production_team_member_id?: string;
          audition_id: string;
          user_id?: string | null;
          role_title: string;
          invited_email?: string | null;
          status?: 'pending' | 'active' | 'declined';
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          production_team_member_id?: string;
          audition_id?: string;
          user_id?: string | null;
          role_title?: string;
          invited_email?: string | null;
          status?: 'pending' | 'active' | 'declined';
          invited_by?: string | null;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'production_team_members_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          },
          {
            foreignKeyName: 'production_team_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'production_team_members_invited_by_fkey';
            columns: ['invited_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      casting_offers: {
        Row: {
          offer_id: string;
          cast_member_id: string;
          audition_id: string;
          user_id: string;
          role_id: string | null;
          sent_by: string;
          offer_message: string | null;
          offer_notes: string | null;
          sent_at: string;
          responded_at: string | null;
          email_sent: boolean;
          email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          offer_id?: string;
          cast_member_id: string;
          audition_id: string;
          user_id: string;
          role_id?: string | null;
          sent_by: string;
          offer_message?: string | null;
          offer_notes?: string | null;
          sent_at?: string;
          responded_at?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          offer_id?: string;
          cast_member_id?: string;
          audition_id?: string;
          user_id?: string;
          role_id?: string | null;
          sent_by?: string;
          offer_message?: string | null;
          offer_notes?: string | null;
          sent_at?: string;
          responded_at?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'casting_offers_cast_member_id_fkey';
            columns: ['cast_member_id'];
            referencedRelation: 'cast_members';
            referencedColumns: ['cast_member_id'];
          },
          {
            foreignKeyName: 'casting_offers_audition_id_fkey';
            columns: ['audition_id'];
            referencedRelation: 'auditions';
            referencedColumns: ['audition_id'];
          },
          {
            foreignKeyName: 'casting_offers_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'casting_offers_role_id_fkey';
            columns: ['role_id'];
            referencedRelation: 'roles';
            referencedColumns: ['role_id'];
          },
          {
            foreignKeyName: 'casting_offers_sent_by_fkey';
            columns: ['sent_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      google_calendar_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string | null;
          expiry_date: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token?: string | null;
          expiry_date?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string | null;
          expiry_date?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'google_calendar_tokens_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      // Add more tables as needed
    };
    Views: {
      // Add views here
    };
    Functions: {
      // Add functions here
    };
    Enums: {
      resume_source_enum: 'manual' | 'application' | 'theater' | 'film' | 'television' | 'commercial' | 'voiceover' | 'other';
      role_type_enum: 'Principal' | 'Ensemble' | 'Understudy' | 'Crew' | 'Other';
      role_genders: 'masculine' | 'feminine' | 'ungendered';
      equity_status_enum: 'Equity' | 'Non-Equity' | 'Hybrid';
      signup_status_enum: 'Signed Up' | 'Callback' | 'Offer Extended' | 'Offer Accepted' | 'Offer Rejected' | 'Rejected';
      cast_status_enum: 'Offered' | 'Accepted' | 'Declined';
    };
  };
}

// Profile type for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// User Resume types for easier use
export type UserResume = Database['public']['Tables']['user_resume']['Row'];
export type UserResumeInsert = Database['public']['Tables']['user_resume']['Insert'];
export type UserResumeUpdate = Database['public']['Tables']['user_resume']['Update'];
export type ResumeSource = Database['public']['Enums']['resume_source_enum'];

// Company types for easier use
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

// Company Approval Request types for easier use
export type CompanyApprovalRequest = Database['public']['Tables']['company_approval_requests']['Row'];
export type CompanyApprovalRequestInsert = Database['public']['Tables']['company_approval_requests']['Insert'];
export type CompanyApprovalRequestUpdate = Database['public']['Tables']['company_approval_requests']['Update'];

// Notification types for easier use
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];
export type NotificationType = 'company_approval' | 'user_affiliation' | 'casting_decision' | 'casting_offer' | 'general';

// Show types for easier use
export type Show = Database['public']['Tables']['shows']['Row'];
export type ShowInsert = Database['public']['Tables']['shows']['Insert'];
export type ShowUpdate = Database['public']['Tables']['shows']['Update'];

// Role types for easier use
export type Role = Database['public']['Tables']['roles']['Row'];
export type RoleInsert = Database['public']['Tables']['roles']['Insert'];
export type RoleUpdate = Database['public']['Tables']['roles']['Update'];
export type RoleType = Database['public']['Enums']['role_type_enum'];
export type RoleGender = Database['public']['Enums']['role_genders'];

// Audition types for easier use
export type Audition = Database['public']['Tables']['auditions']['Row'];
export type AuditionInsert = Database['public']['Tables']['auditions']['Insert'];
export type AuditionUpdate = Database['public']['Tables']['auditions']['Update'];
export type EquityStatus = Database['public']['Enums']['equity_status_enum'];

// Audition Slot types for easier use
export type AuditionSlot = Database['public']['Tables']['audition_slots']['Row'];
export type AuditionSlotInsert = Database['public']['Tables']['audition_slots']['Insert'];
export type AuditionSlotUpdate = Database['public']['Tables']['audition_slots']['Update'];

// Audition Signup types for easier use
export type AuditionSignup = Database['public']['Tables']['audition_signups']['Row'];
export type AuditionSignupInsert = Database['public']['Tables']['audition_signups']['Insert'];
export type AuditionSignupUpdate = Database['public']['Tables']['audition_signups']['Update'];
export type SignupStatus = Database['public']['Enums']['signup_status_enum'];

// Audition Signup with related data (for joins)
export type AuditionSignupWithDetails = AuditionSignup & {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
  } | null;
  audition_slots: {
    slot_id: string;
    start_time: string;
    end_time: string;
    location: string | null;
  } | null;
  roles: {
    role_id: string;
    role_name: string;
    description: string | null;
  } | null;
};

// User Signups with full nested details (slot, audition, show, role)
export type UserSignupsWithDetails = AuditionSignup & {
  audition_slots: {
    slot_id: string;
    start_time: string;
    end_time: string;
    location: string | null;
    auditions: {
      audition_id: string;
      rehearsal_dates: string | null;
      rehearsal_location: string | null;
      performance_dates: string | null;
      performance_location: string | null;
      shows: {
        show_id: string;
        title: string;
        author: string | null;
        description: string | null;
      } | null;
    } | null;
  } | null;
  roles: {
    role_id: string;
    role_name: string;
    description: string | null;
    role_type: RoleType | null;
    gender: RoleGender | null;
  } | null;
};

// Company Member types for easier use
export type CompanyMember = Database['public']['Tables']['company_members']['Row'];
export type CompanyMemberInsert = Database['public']['Tables']['company_members']['Insert'];
export type CompanyMemberUpdate = Database['public']['Tables']['company_members']['Update'];
export type CompanyMemberRole = 'owner' | 'moderator' | 'admin' | 'member' | 'viewer';
export type CompanyMemberStatus = 'active' | 'inactive' | 'pending';

// Company Member with profile details (for joins)
export type CompanyMemberWithProfile = CompanyMember & {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  } | null;
};

// Audition Role types for easier use
export type AuditionRole = Database['public']['Tables']['audition_roles']['Row'];
export type AuditionRoleInsert = Database['public']['Tables']['audition_roles']['Insert'];
export type AuditionRoleUpdate = Database['public']['Tables']['audition_roles']['Update'];

// Cast Member types for easier use
export type CastMember = Database['public']['Tables']['cast_members']['Row'];
export type CastMemberInsert = Database['public']['Tables']['cast_members']['Insert'];
export type CastMemberUpdate = Database['public']['Tables']['cast_members']['Update'];
export type CastStatus = Database['public']['Enums']['cast_status_enum'];

// Callback Slot types for easier use
export type CallbackSlot = Database['public']['Tables']['callback_slots']['Row'];
export type CallbackSlotInsert = Database['public']['Tables']['callback_slots']['Insert'];
export type CallbackSlotUpdate = Database['public']['Tables']['callback_slots']['Update'];

// Callback Invitation types for easier use
export type CallbackInvitation = Database['public']['Tables']['callback_invitations']['Row'];
export type CallbackInvitationInsert = Database['public']['Tables']['callback_invitations']['Insert'];
export type CallbackInvitationUpdate = Database['public']['Tables']['callback_invitations']['Update'];
export type CallbackInvitationStatus = 'pending' | 'accepted' | 'rejected';

// Production Team Member types for easier use
export type ProductionTeamMember = Database['public']['Tables']['production_team_members']['Row'];
export type ProductionTeamMemberInsert = Database['public']['Tables']['production_team_members']['Insert'];
export type ProductionTeamMemberUpdate = Database['public']['Tables']['production_team_members']['Update'];
export type ProductionTeamMemberStatus = 'pending' | 'active' | 'declined';

// Production Team Member with profile details (for joins)
export type ProductionTeamMemberWithProfile = ProductionTeamMember & {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  } | null;
};

// Casting Offer types for easier use
export type CastingOffer = Database['public']['Tables']['casting_offers']['Row'];
export type CastingOfferInsert = Database['public']['Tables']['casting_offers']['Insert'];
export type CastingOfferUpdate = Database['public']['Tables']['casting_offers']['Update'];

// Casting Offer with related data (for joins)
export type CastingOfferWithDetails = CastingOffer & {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  } | null;
  roles: {
    role_id: string;
    role_name: string;
    description: string | null;
  } | null;
  auditions: {
    audition_id: string;
    shows: {
      show_id: string;
      title: string;
      author: string | null;
    } | null;
  } | null;
  cast_members: {
    cast_member_id: string;
    status: CastStatus | null;
    is_understudy: boolean;
  } | null;
};

// Google Calendar Token types for easier use
export type GoogleCalendarToken = Database['public']['Tables']['google_calendar_tokens']['Row'];
export type GoogleCalendarTokenInsert = Database['public']['Tables']['google_calendar_tokens']['Insert'];
export type GoogleCalendarTokenUpdate = Database['public']['Tables']['google_calendar_tokens']['Update'];

// Auth-related types
export interface AuthError {
  message: string;
  status?: number;
}

export interface SignUpData {
  email: string;
  password: string;
  options?: {
    data?: {
      full_name?: string;
      avatar_url?: string;
      [key: string]: any;
    };
    emailRedirectTo?: string;
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'facebook' | 'twitter';
  options?: {
    redirectTo?: string;
    scopes?: string;
    queryParams?: Record<string, string>;
  };
}

// User metadata type
export interface UserMetadata {
  avatar_url?: string;
  full_name?: string;
  [key: string]: any;
}

// Extended user type with metadata
export interface ExtendedUser extends User {
  user_metadata: UserMetadata;
}

// --- Calendar/Event types used by UI forms ---
export type EventFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface EventFormData {
  title: string;
  description?: string;
  start: string; // ISO string for datetime-local or date
  end: string;   // ISO string
  allDay: boolean;
  location?: string;
  color?: string;
  isRecurring: boolean;
  recurrence: {
    frequency: EventFrequency;
    customFrequencyType?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'; // Used when frequency is CUSTOM
    interval: number;
    byDay: string[];      // e.g. ['MO','WE']
    byMonthDay: number[]; // specific days of month
    byMonth: number[];    // 1-12
    endType: 'never' | 'on' | 'after';
    endDate: string;      // YYYY-MM-DD when endType === 'on'
    occurrences: number;  // when endType === 'after'
  };
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  location?: string | null;
  color?: string | null;
  isRecurring?: boolean;
  recurrenceRule?: any | null;
  // Metadata for recurring event instances
  _isInstance?: boolean;
  _originalEventId?: string;
  _instanceDate?: string;
}
