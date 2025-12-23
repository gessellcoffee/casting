-- =============================================
-- PROCESS PENDING SIGNUPS ON USER CREATION
-- =============================================
-- Purpose: Automatically process all pending invitations when a user signs up
-- Triggered by: New user creation in profiles table
-- Actions:
--   - Creates cast_members and casting_offers for casting invitations
--   - Creates company_members for company invitations
--   - Creates callback_invitations for callback invitations
--   - Creates notifications for each processed invitation
--   - Marks pending_signups as completed

CREATE OR REPLACE FUNCTION process_pending_signups_on_user_creation()
RETURNS TRIGGER AS $$
DECLARE
  pending_record RECORD;
  new_cast_member_id UUID;
  new_casting_offer_id UUID;
  new_company_member_id UUID;
  new_callback_id UUID;
  inviter_profile RECORD;
BEGIN
  -- Find all active pending signups for this email
  FOR pending_record IN 
    SELECT * FROM pending_signups 
    WHERE LOWER(email) = LOWER(NEW.email) 
    AND completed_at IS NULL
    AND cancelled_at IS NULL
    AND expires_at > NOW()
    ORDER BY created_at ASC
  LOOP
    -- Get inviter profile info for notifications
    SELECT username, full_name INTO inviter_profile
    FROM profiles
    WHERE user_id = pending_record.invited_by;
    
    -- Process based on request_type
    CASE pending_record.request_type
      
      -- CASTING OFFER
      WHEN 'casting_offer' THEN
        -- Create cast_member record
        INSERT INTO cast_members (
          audition_id,
          user_id,
          role_id,
          audition_role_id,
          is_understudy,
          status
        ) VALUES (
          (pending_record.request_data->>'audition_id')::UUID,
          NEW.user_id,
          NULLIF(pending_record.request_data->>'role_id', '')::UUID,
          NULLIF(pending_record.request_data->>'audition_role_id', '')::UUID,
          COALESCE((pending_record.request_data->>'is_understudy')::BOOLEAN, false),
          'Offered'
        ) RETURNING cast_member_id INTO new_cast_member_id;
        
        -- Create casting_offer record
        INSERT INTO casting_offers (
          cast_member_id,
          sent_by,
          offer_message,
          email_sent
        ) VALUES (
          new_cast_member_id,
          pending_record.invited_by,
          pending_record.request_data->>'offer_message',
          true
        ) RETURNING casting_offer_id INTO new_casting_offer_id;
        
        -- Create notification
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link,
          metadata
        ) VALUES (
          NEW.user_id,
          'casting_offer',
          'Casting Offer from ' || COALESCE(inviter_profile.full_name, inviter_profile.username),
          'You have been offered the role of ' || (pending_record.request_data->>'role_name') || 
          ' in ' || (pending_record.request_data->>'show_title'),
          '/offers',
          jsonb_build_object(
            'casting_offer_id', new_casting_offer_id,
            'audition_id', pending_record.request_data->>'audition_id',
            'from_pending_signup', true
          )
        );
      
      -- COMPANY MEMBER
      WHEN 'company_member' THEN
        -- Create company_member record
        INSERT INTO company_members (
          company_id,
          user_id,
          role,
          status
        ) VALUES (
          (pending_record.request_data->>'company_id')::UUID,
          NEW.user_id,
          pending_record.request_data->>'role',
          'active'
        ) RETURNING company_member_id INTO new_company_member_id;
        
        -- Create notification
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link,
          metadata
        ) VALUES (
          NEW.user_id,
          'user_affiliation',
          'Added to Company by ' || COALESCE(inviter_profile.full_name, inviter_profile.username),
          'You have been added to ' || (pending_record.request_data->>'company_name') || 
          ' as a ' || (pending_record.request_data->>'role'),
          '/company',
          jsonb_build_object(
            'company_id', pending_record.request_data->>'company_id',
            'from_pending_signup', true
          )
        );
      
      -- CALLBACK INVITATION
      WHEN 'callback_invitation' THEN
        -- Create callback_invitation record
        INSERT INTO callback_invitations (
          audition_id,
          user_id,
          callback_date,
          callback_time,
          invited_by,
          status
        ) VALUES (
          (pending_record.request_data->>'audition_id')::UUID,
          NEW.user_id,
          (pending_record.request_data->>'callback_date')::DATE,
          (pending_record.request_data->>'callback_time')::TIME,
          pending_record.invited_by,
          'pending'
        ) RETURNING callback_invitation_id INTO new_callback_id;
        
        -- Create notification
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link,
          metadata
        ) VALUES (
          NEW.user_id,
          'callback_invitation',
          'Callback Invitation from ' || COALESCE(inviter_profile.full_name, inviter_profile.username),
          'You have been invited to a callback for ' || (pending_record.request_data->>'show_title'),
          '/my-auditions',
          jsonb_build_object(
            'callback_invitation_id', new_callback_id,
            'audition_id', pending_record.request_data->>'audition_id',
            'from_pending_signup', true
          )
        );
    END CASE;
    
    -- Mark pending signup as completed
    UPDATE pending_signups 
    SET 
      completed_at = NOW(), 
      completed_by = NEW.user_id
    WHERE pending_signup_id = pending_record.pending_signup_id;
    
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_process_pending_signups ON profiles;
CREATE TRIGGER trigger_process_pending_signups
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_signups_on_user_creation();

COMMENT ON FUNCTION process_pending_signups_on_user_creation() IS 'Automatically processes all pending invitations when a user signs up with a matching email';
