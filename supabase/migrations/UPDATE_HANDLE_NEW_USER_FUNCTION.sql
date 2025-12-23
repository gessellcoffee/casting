-- Update the handle_new_user function to include profile_photo_url and handle Google metadata better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_name_value TEXT;
  last_name_value TEXT;
  full_name_value TEXT;
  avatar_url_value TEXT;
  space_position INT;
BEGIN
  -- 1. Try to get explicit first/last name
  first_name_value := NULLIF(new.raw_user_meta_data->>'first_name', '');
  last_name_value := NULLIF(new.raw_user_meta_data->>'last_name', '');
  
  -- 2. If missing, try to split 'full_name' or 'name' (common in Google OAuth)
  IF first_name_value IS NULL OR last_name_value IS NULL THEN
    full_name_value := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
    
    IF length(full_name_value) > 0 THEN
      space_position := position(' ' in full_name_value);
      
      IF space_position > 0 THEN
        first_name_value := COALESCE(first_name_value, substring(full_name_value from 1 for space_position - 1));
        last_name_value := COALESCE(last_name_value, substring(full_name_value from space_position + 1));
      ELSE
        first_name_value := COALESCE(first_name_value, full_name_value);
        last_name_value := COALESCE(last_name_value, '');
      END IF;
    END IF;
  END IF;

  -- 3. Get Avatar
  avatar_url_value := COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '');
  
  -- 4. Insert into profiles table
  INSERT INTO public.profiles (
    id, 
    email,
    first_name,
    last_name,
    profile_photo_url
  )
  VALUES (
    new.id, 
    new.email, -- Use the auth.users email directly
    COALESCE(first_name_value, ''),
    COALESCE(last_name_value, ''),
    NULLIF(avatar_url_value, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Only update name fields if they are currently empty in the profile
    first_name = CASE WHEN profiles.first_name IS NULL OR profiles.first_name = '' THEN EXCLUDED.first_name ELSE profiles.first_name END,
    last_name = CASE WHEN profiles.last_name IS NULL OR profiles.last_name = '' THEN EXCLUDED.last_name ELSE profiles.last_name END,
    profile_photo_url = COALESCE(EXCLUDED.profile_photo_url, profiles.profile_photo_url);
    
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;
