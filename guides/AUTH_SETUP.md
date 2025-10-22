# Authentication Setup Guide

This application uses Supabase for authentication. Follow these steps to set up authentication:

## 1. Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Supabase Dashboard Setup

### Enable Email Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)

### Enable Google OAuth (Optional)

1. Go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### Configure Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

## 3. Database Setup (Optional)

If you want to store additional user profile data:

```sql
-- Create a profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a trigger to create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Features Implemented

### Login Page (`/login`)
- Email/password sign in
- Email/password sign up
- Google OAuth sign in
- Form validation
- Error handling
- Success messages

### Authentication Functions (`src/lib/supabase/auth.ts`)
- `signInWithEmail(email, password)` - Sign in with email/password
- `signUpWithEmail(email, password)` - Create new account
- `signInWithOAuth(provider)` - OAuth sign in (Google, GitHub, etc.)
- `signOut()` - Sign out current user
- `getSession()` - Get current session
- `getUser()` - Get current user
- `resetPassword(email)` - Send password reset email
- `updatePassword(newPassword)` - Update user password
- `onAuthStateChange(callback)` - Listen to auth state changes

### Navigation Bar
- Shows "Login" button when user is not authenticated
- Shows user avatar and "Sign Out" button when authenticated
- Responsive mobile menu with auth state

### Protected Routes (Middleware)
- Automatically refreshes user session
- Can be extended to protect specific routes

## 5. Usage Examples

### Check if user is logged in (Client Component)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/supabase';

export default function MyComponent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser().then(setUser).catch(() => setUser(null));
  }, []);

  if (!user) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user.email}!</div>;
}
```

### Protect a page (Server Component)

```tsx
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <div>Protected content</div>;
}
```

### Sign out

```tsx
import { signOut } from '@/lib/supabase';

async function handleSignOut() {
  await signOut();
  // Redirect or refresh page
}
```

## 6. Testing

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Try creating an account with email/password
4. Check your email for confirmation (if email confirmation is enabled)
5. Try signing in with the created account
6. Test the sign out functionality

## 7. Security Best Practices

- Never commit `.env.local` to version control
- Use Row Level Security (RLS) policies in Supabase
- Validate user input on both client and server
- Use HTTPS in production
- Implement rate limiting for authentication endpoints
- Enable email confirmation for new accounts
- Use strong password requirements

## 8. Troubleshooting

### "Invalid login credentials" error
- Check that email/password are correct
- Verify email confirmation is complete (if enabled)
- Check Supabase logs in dashboard

### OAuth redirect not working
- Verify redirect URLs are configured in Supabase dashboard
- Check that OAuth credentials are correct
- Ensure Site URL is set correctly

### Session not persisting
- Check that cookies are enabled in browser
- Verify middleware is running correctly
- Check for CORS issues

## 9. Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
