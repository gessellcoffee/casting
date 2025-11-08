export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agenda_assignments: {
        Row: {
          agenda_assignments_id: string
          agenda_item_id: string | null
          conflict_note: string | null
          created_at: string | null
          notified_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          agenda_assignments_id?: string
          agenda_item_id?: string | null
          conflict_note?: string | null
          created_at?: string | null
          notified_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          agenda_assignments_id?: string
          agenda_item_id?: string | null
          conflict_note?: string | null
          created_at?: string | null
          notified_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_assignments_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "rehearsal_agenda_items"
            referencedColumns: ["rehearsal_agenda_items_id"]
          },
          {
            foreignKeyName: "agenda_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audition_dates_backup: {
        Row: {
          audition_dates: Json | null
          audition_id: string | null
          backup_timestamp: string | null
        }
        Insert: {
          audition_dates?: Json | null
          audition_id?: string | null
          backup_timestamp?: string | null
        }
        Update: {
          audition_dates?: Json | null
          audition_id?: string | null
          backup_timestamp?: string | null
        }
        Relationships: []
      }
      audition_roles: {
        Row: {
          audition_id: string
          audition_role_id: string
          created_at: string | null
          description: string | null
          gender: Database["public"]["Enums"]["role_genders"] | null
          needs_understudy: boolean | null
          role_id: string | null
          role_name: string
          role_type: Database["public"]["Enums"]["role_type_enum"] | null
          updated_at: string | null
        }
        Insert: {
          audition_id: string
          audition_role_id?: string
          created_at?: string | null
          description?: string | null
          gender?: Database["public"]["Enums"]["role_genders"] | null
          needs_understudy?: boolean | null
          role_id?: string | null
          role_name: string
          role_type?: Database["public"]["Enums"]["role_type_enum"] | null
          updated_at?: string | null
        }
        Update: {
          audition_id?: string
          audition_role_id?: string
          created_at?: string | null
          description?: string | null
          gender?: Database["public"]["Enums"]["role_genders"] | null
          needs_understudy?: boolean | null
          role_id?: string | null
          role_name?: string
          role_type?: Database["public"]["Enums"]["role_type_enum"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audition_roles_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
          {
            foreignKeyName: "audition_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      audition_signups: {
        Row: {
          created_at: string
          role_id: string | null
          signup_id: string
          slot_id: string
          status: Database["public"]["Enums"]["signup_status_enum"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id?: string | null
          signup_id?: string
          slot_id: string
          status?: Database["public"]["Enums"]["signup_status_enum"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string | null
          signup_id?: string
          slot_id?: string
          status?: Database["public"]["Enums"]["signup_status_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audition_signups_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "audition_signups_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "audition_slots"
            referencedColumns: ["slot_id"]
          },
          {
            foreignKeyName: "audition_signups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audition_slots: {
        Row: {
          audition_id: string
          end_time: string
          location: string | null
          max_signups: number | null
          slot_id: string
          start_time: string
        }
        Insert: {
          audition_id: string
          end_time: string
          location?: string | null
          max_signups?: number | null
          slot_id?: string
          start_time: string
        }
        Update: {
          audition_id?: string
          end_time?: string
          location?: string | null
          max_signups?: number | null
          slot_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "audition_slots_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
        ]
      }
      auditions: {
        Row: {
          audition_dates: Json | null
          audition_details: string | null
          audition_id: string
          audition_location: string | null
          company_id: string | null
          created_at: string
          ensemble_size: number | null
          equity_status:
            | Database["public"]["Enums"]["equity_status_enum"]
            | null
          instructions: string | null
          is_paid: boolean | null
          pay_comments: string | null
          pay_range: string | null
          performance_dates: string | null
          performance_location: string | null
          rehearsal_dates: string | null
          rehearsal_location: string | null
          show_filled_slots: boolean | null
          show_id: string
          user_id: string
          workflow_status: Database["public"]["Enums"]["workflow_status"] | null
        }
        Insert: {
          audition_dates?: Json | null
          audition_details?: string | null
          audition_id?: string
          audition_location?: string | null
          company_id?: string | null
          created_at?: string
          ensemble_size?: number | null
          equity_status?:
            | Database["public"]["Enums"]["equity_status_enum"]
            | null
          instructions?: string | null
          is_paid?: boolean | null
          pay_comments?: string | null
          pay_range?: string | null
          performance_dates?: string | null
          performance_location?: string | null
          rehearsal_dates?: string | null
          rehearsal_location?: string | null
          show_filled_slots?: boolean | null
          show_id: string
          user_id: string
          workflow_status?:
            | Database["public"]["Enums"]["workflow_status"]
            | null
        }
        Update: {
          audition_dates?: Json | null
          audition_details?: string | null
          audition_id?: string
          audition_location?: string | null
          company_id?: string | null
          created_at?: string
          ensemble_size?: number | null
          equity_status?:
            | Database["public"]["Enums"]["equity_status_enum"]
            | null
          instructions?: string | null
          is_paid?: boolean | null
          pay_comments?: string | null
          pay_range?: string | null
          performance_dates?: string | null
          performance_location?: string | null
          rehearsal_dates?: string | null
          rehearsal_location?: string | null
          show_filled_slots?: boolean | null
          show_id?: string
          user_id?: string
          workflow_status?:
            | Database["public"]["Enums"]["workflow_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "auditions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "auditions_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["show_id"]
          },
          {
            foreignKeyName: "auditions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_invitations: {
        Row: {
          actor_comment: string | null
          audition_id: string
          callback_slot_id: string
          casting_notes: string | null
          created_at: string | null
          invitation_id: string
          invited_at: string | null
          responded_at: string | null
          signup_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actor_comment?: string | null
          audition_id: string
          callback_slot_id: string
          casting_notes?: string | null
          created_at?: string | null
          invitation_id?: string
          invited_at?: string | null
          responded_at?: string | null
          signup_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actor_comment?: string | null
          audition_id?: string
          callback_slot_id?: string
          casting_notes?: string | null
          created_at?: string | null
          invitation_id?: string
          invited_at?: string | null
          responded_at?: string | null
          signup_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "callback_invitations_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
          {
            foreignKeyName: "callback_invitations_callback_slot_id_fkey"
            columns: ["callback_slot_id"]
            isOneToOne: false
            referencedRelation: "callback_slots"
            referencedColumns: ["callback_slot_id"]
          },
          {
            foreignKeyName: "callback_invitations_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "audition_signups"
            referencedColumns: ["signup_id"]
          },
          {
            foreignKeyName: "callback_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_slots: {
        Row: {
          audition_id: string
          callback_slot_id: string
          created_at: string | null
          end_time: string
          location: string | null
          max_signups: number | null
          notes: string | null
          start_time: string
        }
        Insert: {
          audition_id: string
          callback_slot_id?: string
          created_at?: string | null
          end_time: string
          location?: string | null
          max_signups?: number | null
          notes?: string | null
          start_time: string
        }
        Update: {
          audition_id?: string
          callback_slot_id?: string
          created_at?: string | null
          end_time?: string
          location?: string | null
          max_signups?: number | null
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "callback_slots_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
        ]
      }
      cast_members: {
        Row: {
          audition_id: string
          audition_role_id: string
          cast_member_id: string
          is_understudy: boolean | null
          role_id: string | null
          status: Database["public"]["Enums"]["cast_status_enum"] | null
          user_id: string
        }
        Insert: {
          audition_id: string
          audition_role_id: string
          cast_member_id?: string
          is_understudy?: boolean | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["cast_status_enum"] | null
          user_id: string
        }
        Update: {
          audition_id?: string
          audition_role_id?: string
          cast_member_id?: string
          is_understudy?: boolean | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["cast_status_enum"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cast_members_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
          {
            foreignKeyName: "cast_members_audition_role_id_fkey"
            columns: ["audition_role_id"]
            isOneToOne: false
            referencedRelation: "audition_roles"
            referencedColumns: ["audition_role_id"]
          },
          {
            foreignKeyName: "cast_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "cast_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_offers: {
        Row: {
          audition_id: string
          cast_member_id: string
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          offer_id: string
          offer_message: string | null
          offer_notes: string | null
          responded_at: string | null
          role_id: string | null
          sent_at: string
          sent_by: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audition_id: string
          cast_member_id: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          offer_id?: string
          offer_message?: string | null
          offer_notes?: string | null
          responded_at?: string | null
          role_id?: string | null
          sent_at?: string
          sent_by: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audition_id?: string
          cast_member_id?: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          offer_id?: string
          offer_message?: string | null
          offer_notes?: string | null
          responded_at?: string | null
          role_id?: string | null
          sent_at?: string
          sent_by?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casting_offers_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
          {
            foreignKeyName: "casting_offers_cast_member_id_fkey"
            columns: ["cast_member_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["cast_member_id"]
          },
          {
            foreignKeyName: "casting_offers_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "casting_offers_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          creator_user_id: string
          description: string | null
          image_gallery: Json | null
          mission: string | null
          name: string
          values: string | null
          vision: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string
          created_at?: string
          creator_user_id?: string
          description?: string | null
          image_gallery?: Json | null
          mission?: string | null
          name: string
          values?: string | null
          vision?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          creator_user_id?: string
          description?: string | null
          image_gallery?: Json | null
          mission?: string | null
          name?: string
          values?: string | null
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_approval_requests: {
        Row: {
          company_id: string
          created_at: string | null
          request_id: string
          resume_entry_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          request_id?: string
          resume_entry_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          request_id?: string
          resume_entry_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_approval_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_approval_requests_resume_entry_id_fkey"
            columns: ["resume_entry_id"]
            isOneToOne: false
            referencedRelation: "user_resume"
            referencedColumns: ["resume_entry_id"]
          },
          {
            foreignKeyName: "company_approval_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string | null
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          member_id: string
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          member_id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          member_id?: string
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_recurring: boolean | null
          location: string | null
          recurrence_rule_id: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          recurrence_rule_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          recurrence_rule_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_recurrence_rule_id_fkey"
            columns: ["recurrence_rule_id"]
            isOneToOne: false
            referencedRelation: "recurrence_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expiry_date: number | null
          id: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expiry_date?: number | null
          id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expiry_date?: number | null
          id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_taken: string | null
          action_url: string | null
          created_at: string | null
          is_actionable: boolean | null
          is_read: boolean | null
          message: string
          notification_id: string
          read_at: string | null
          recipient_id: string
          reference_id: string | null
          reference_type: string | null
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_taken?: string | null
          action_url?: string | null
          created_at?: string | null
          is_actionable?: boolean | null
          is_read?: boolean | null
          message: string
          notification_id?: string
          read_at?: string | null
          recipient_id: string
          reference_id?: string | null
          reference_type?: string | null
          sender_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_taken?: string | null
          action_url?: string | null
          created_at?: string | null
          is_actionable?: boolean | null
          is_read?: boolean | null
          message?: string
          notification_id?: string
          read_at?: string | null
          recipient_id?: string
          reference_id?: string | null
          reference_type?: string | null
          sender_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_events: {
        Row: {
          audition_id: string | null
          call_time: string
          created_at: string | null
          curtain_time: string
          date: string
          location: string | null
          notes: string | null
          performance_events_id: string
          updated_at: string | null
        }
        Insert: {
          audition_id?: string | null
          call_time: string
          created_at?: string | null
          curtain_time: string
          date: string
          location?: string | null
          notes?: string | null
          performance_events_id?: string
          updated_at?: string | null
        }
        Update: {
          audition_id?: string | null
          call_time?: string
          created_at?: string | null
          curtain_time?: string
          date?: string
          location?: string | null
          notes?: string | null
          performance_events_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_events_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
        ]
      }
      production_team_members: {
        Row: {
          audition_id: string
          created_at: string | null
          invited_at: string | null
          invited_by: string | null
          invited_email: string | null
          joined_at: string | null
          production_team_member_id: string
          role_title: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          audition_id: string
          created_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          invited_email?: string | null
          joined_at?: string | null
          production_team_member_id?: string
          role_title: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          audition_id?: string
          created_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          invited_email?: string | null
          joined_at?: string | null
          production_team_member_id?: string
          role_title?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_team_members_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
          {
            foreignKeyName: "production_team_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          description: string | null
          education: Json | null
          email: string
          first_name: string | null
          id: string
          image_gallery: Json | null
          last_name: string | null
          location: string | null
          location_lat: number | null
          location_lng: number | null
          middle_name: string | null
          preferences: Json | null
          profile_photo_url: string | null
          rehearsal_reminder_hours: number | null
          resume_url: string | null
          search_vector: unknown
          skills: Json | null
          video_gallery: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          education?: Json | null
          email: string
          first_name?: string | null
          id: string
          image_gallery?: Json | null
          last_name?: string | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          middle_name?: string | null
          preferences?: Json | null
          profile_photo_url?: string | null
          rehearsal_reminder_hours?: number | null
          resume_url?: string | null
          search_vector?: unknown
          skills?: Json | null
          video_gallery?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          education?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          image_gallery?: Json | null
          last_name?: string | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          middle_name?: string | null
          preferences?: Json | null
          profile_photo_url?: string | null
          rehearsal_reminder_hours?: number | null
          resume_url?: string | null
          search_vector?: unknown
          skills?: Json | null
          video_gallery?: Json | null
        }
        Relationships: []
      }
      recurrence_rules: {
        Row: {
          by_day: string[] | null
          by_hour: number[] | null
          by_minute: number[] | null
          by_month: number[] | null
          by_month_day: number[] | null
          by_second: number[] | null
          by_set_pos: number[] | null
          by_week_number: number[] | null
          by_year_day: number[] | null
          count: number | null
          created_at: string | null
          frequency: string
          id: string
          interval: number
          timezone: string | null
          until: string | null
          updated_at: string | null
          week_start: string | null
        }
        Insert: {
          by_day?: string[] | null
          by_hour?: number[] | null
          by_minute?: number[] | null
          by_month?: number[] | null
          by_month_day?: number[] | null
          by_second?: number[] | null
          by_set_pos?: number[] | null
          by_week_number?: number[] | null
          by_year_day?: number[] | null
          count?: number | null
          created_at?: string | null
          frequency: string
          id?: string
          interval?: number
          timezone?: string | null
          until?: string | null
          updated_at?: string | null
          week_start?: string | null
        }
        Update: {
          by_day?: string[] | null
          by_hour?: number[] | null
          by_minute?: number[] | null
          by_month?: number[] | null
          by_month_day?: number[] | null
          by_second?: number[] | null
          by_set_pos?: number[] | null
          by_week_number?: number[] | null
          by_year_day?: number[] | null
          count?: number | null
          created_at?: string | null
          frequency?: string
          id?: string
          interval?: number
          timezone?: string | null
          until?: string | null
          updated_at?: string | null
          week_start?: string | null
        }
        Relationships: []
      }
      rehearsal_agenda_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          rehearsal_agenda_items_id: string
          rehearsal_event_id: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          rehearsal_agenda_items_id?: string
          rehearsal_event_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          rehearsal_agenda_items_id?: string
          rehearsal_event_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_agenda_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rehearsal_agenda_items_rehearsal_event_id_fkey"
            columns: ["rehearsal_event_id"]
            isOneToOne: false
            referencedRelation: "rehearsal_events"
            referencedColumns: ["rehearsal_events_id"]
          },
        ]
      }
      rehearsal_events: {
        Row: {
          audition_id: string | null
          created_at: string | null
          date: string
          end_time: string
          location: string | null
          notes: string | null
          rehearsal_events_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          audition_id?: string | null
          created_at?: string | null
          date: string
          end_time: string
          location?: string | null
          notes?: string | null
          rehearsal_events_id?: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          audition_id?: string | null
          created_at?: string | null
          date?: string
          end_time?: string
          location?: string | null
          notes?: string | null
          rehearsal_events_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rehearsal_events_audition_id_fkey"
            columns: ["audition_id"]
            isOneToOne: false
            referencedRelation: "auditions"
            referencedColumns: ["audition_id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          gender: Database["public"]["Enums"]["role_genders"] | null
          needs_understudy: boolean | null
          role_id: string
          role_name: string
          role_type: Database["public"]["Enums"]["role_type_enum"] | null
          show_id: string
        }
        Insert: {
          description?: string | null
          gender?: Database["public"]["Enums"]["role_genders"] | null
          needs_understudy?: boolean | null
          role_id?: string
          role_name: string
          role_type?: Database["public"]["Enums"]["role_type_enum"] | null
          show_id: string
        }
        Update: {
          description?: string | null
          gender?: Database["public"]["Enums"]["role_genders"] | null
          needs_understudy?: boolean | null
          role_id?: string
          role_name?: string
          role_type?: Database["public"]["Enums"]["role_type_enum"] | null
          show_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["show_id"]
          },
        ]
      }
      shows: {
        Row: {
          author: string | null
          created_at: string
          creator_user_id: string | null
          description: string | null
          show_id: string
          title: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          creator_user_id?: string | null
          description?: string | null
          show_id?: string
          title: string
        }
        Update: {
          author?: string | null
          created_at?: string
          creator_user_id?: string | null
          description?: string | null
          show_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shows_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_resume: {
        Row: {
          company_approved: boolean | null
          company_id: string | null
          company_name: string | null
          date_of_production: string | null
          resume_entry_id: string
          role: string | null
          show_name: string | null
          source: Database["public"]["Enums"]["resume_source_enum"]
          user_id: string
        }
        Insert: {
          company_approved?: boolean | null
          company_id?: string | null
          company_name?: string | null
          date_of_production?: string | null
          resume_entry_id?: string
          role?: string | null
          show_name?: string | null
          source?: Database["public"]["Enums"]["resume_source_enum"]
          user_id: string
        }
        Update: {
          company_approved?: boolean | null
          company_id?: string | null
          company_name?: string | null
          date_of_production?: string | null
          resume_entry_id?: string
          role?: string | null
          show_name?: string | null
          source?: Database["public"]["Enums"]["resume_source_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_resume_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_resume_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_assign_agenda_items: {
        Args: { p_agenda_item_id: string; p_user_ids: string[] }
        Returns: undefined
      }
      generate_recurring_instances: {
        Args: { p_end_date: string; p_event_id?: string; p_start_date: string }
        Returns: {
          all_day: boolean
          color: string
          description: string
          end_time: string
          id: string
          is_recurring: boolean
          location: string
          recurrence_rule_id: string
          start_time: string
          title: string
        }[]
      }
      send_casting_offer: {
        Args: {
          p_audition_id: string
          p_is_understudy: boolean
          p_offer_message: string
          p_offer_notes: string
          p_role_id: string
          p_sent_by: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      cast_status_enum: "Offered" | "Accepted" | "Declined"
      equity_status_enum: "Equity" | "Non-Equity" | "Hybrid"
      resume_source_enum: "Manual" | "Application"
      role_genders: "masculine" | "feminine" | "ungendered"
      role_type_enum: "Principal" | "Ensemble" | "Understudy" | "Crew" | "Other"
      signup_status_enum:
        | "Signed Up"
        | "Callback"
        | "Offer Extended"
        | "Offer Accepted"
        | "Offer Rejected"
        | "Rejected"
      workflow_status:
        | "auditioning"
        | "casting"
        | "offering_roles"
        | "rehearsing"
        | "performing"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cast_status_enum: ["Offered", "Accepted", "Declined"],
      equity_status_enum: ["Equity", "Non-Equity", "Hybrid"],
      resume_source_enum: ["Manual", "Application"],
      role_genders: ["masculine", "feminine", "ungendered"],
      role_type_enum: ["Principal", "Ensemble", "Understudy", "Crew", "Other"],
      signup_status_enum: [
        "Signed Up",
        "Callback",
        "Offer Extended",
        "Offer Accepted",
        "Offer Rejected",
        "Rejected",
      ],
      workflow_status: [
        "auditioning",
        "casting",
        "offering_roles",
        "rehearsing",
        "performing",
        "completed",
      ],
    },
  },
} as const

// Helper type exports for common table operations
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type CompanyMemberWithProfile = Database['public']['Tables']['company_members']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export type CompanyMemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export type CompanyApprovalRequest = Database['public']['Tables']['company_approval_requests']['Row'];
export type CompanyApprovalRequestInsert = Database['public']['Tables']['company_approval_requests']['Insert'];
export type CompanyApprovalRequestUpdate = Database['public']['Tables']['company_approval_requests']['Update'];

export type UserResume = Database['public']['Tables']['user_resume']['Row'];
export type ResumeSource = 'Equity' | 'Non-Equity' | 'Student' | 'Community' | 'Other';

export type Profile = Database['public']['Tables']['profiles']['Row'];

// Audition and Role types
export type Audition = Database['public']['Tables']['auditions']['Row'];
export type AuditionInsert = Database['public']['Tables']['auditions']['Insert'];
export type AuditionUpdate = Database['public']['Tables']['auditions']['Update'];

export type AuditionRole = Database['public']['Tables']['audition_roles']['Row'];
export type AuditionRoleInsert = Database['public']['Tables']['audition_roles']['Insert'];
export type AuditionRoleUpdate = Database['public']['Tables']['audition_roles']['Update'];

// Cast Member types
export type CastMember = Database['public']['Tables']['cast_members']['Row'];
export type CastMemberInsert = Database['public']['Tables']['cast_members']['Insert'];
export type CastMemberUpdate = Database['public']['Tables']['cast_members']['Update'];

// Casting Offer types
export type CastingOffer = Database['public']['Tables']['casting_offers']['Row'];
export type CastingOfferInsert = Database['public']['Tables']['casting_offers']['Insert'];
export type CastingOfferUpdate = Database['public']['Tables']['casting_offers']['Update'];

export type RehearsalEvent = Database['public']['Tables']['rehearsal_events']['Row'];
export type RehearsalEventInsert = Database['public']['Tables']['rehearsal_events']['Insert'];
export type RehearsalEventUpdate = Database['public']['Tables']['rehearsal_events']['Update'];

export type RehearsalAgendaItem = Database['public']['Tables']['rehearsal_agenda_items']['Row'];
export type RehearsalAgendaItemInsert = Database['public']['Tables']['rehearsal_agenda_items']['Insert'];
export type RehearsalAgendaItemUpdate = Database['public']['Tables']['rehearsal_agenda_items']['Update'];

export type RehearsalAgendaItemAssignment = Database['public']['Tables']['rehearsal_agenda_item_assignments']['Row'];
export type RehearsalAgendaItemAssignmentInsert = Database['public']['Tables']['rehearsal_agenda_item_assignments']['Insert'];
export type RehearsalAgendaItemAssignmentUpdate = Database['public']['Tables']['rehearsal_agenda_item_assignments']['Update'];

// User type (alias for Profile)
export type User = Profile;

// Extended types with relations
export type CastingOfferWithDetails = CastingOffer & {
  cast_member: CastMember & {
    user: Profile;
    audition_role: AuditionRole;
  };
  audition: Audition;
};
