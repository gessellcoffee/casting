# Authentication Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Configure Environment Variables
Create or update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Enable Email Auth in Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Save changes

### Step 3: Run Your App
```bash
npm run dev
```

Visit `http://localhost:3000/login` to test!

---

## 📍 Available Routes

| Route | Description | Protected |
|-------|-------------|-----------|
| `/login` | Sign in / Sign up page | No |
| `/forgot-password` | Password reset page | No |
| `/profile` | User profile page | Yes |
| `/auth/callback` | OAuth callback handler | No |

---

## 🔧 Common Code Snippets

### Get Current User
```tsx
import { getUser } from '@/lib/supabase';

const user = await getUser();
```

### Sign Out
```tsx
import { signOut } from '@/lib/supabase';

await signOut();
```

### Protect a Page
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### Check Auth State
```tsx
import { supabase } from '@/lib/supabase';

supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
});
```

---

## 🎨 Pages You Can Use

### Login Page
- URL: `/login`
- Features: Email/password, Google OAuth, Sign up toggle
- Styled with cosmic theme

### Profile Page
- URL: `/profile`
- Features: User info display, avatar, metadata
- Automatically protected

### Forgot Password
- URL: `/forgot-password`
- Features: Email-based password reset

---

## 🔐 Enable Google OAuth (Optional)

1. **Get Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

2. **Configure in Supabase**
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Add Client ID and Client Secret
   - Save

3. **Test**
   - Click "Continue with Google" on login page

---

## 📚 Full Documentation

For detailed setup and advanced features, see:
- `AUTH_SETUP.md` - Complete setup guide
- `AUTHENTICATION_SUMMARY.md` - Implementation details

---

## 🐛 Troubleshooting

**Can't sign in?**
- Check environment variables are set
- Verify email provider is enabled in Supabase
- Check browser console for errors

**OAuth not working?**
- Verify redirect URLs in Supabase dashboard
- Check OAuth credentials are correct
- Ensure Site URL is configured

**Session not persisting?**
- Clear browser cookies
- Check middleware is running
- Verify Supabase URL and key are correct

---

## ✨ What's Included

✅ Email/password authentication  
✅ Google OAuth (ready to configure)  
✅ Password reset flow  
✅ Protected routes  
✅ User profile page  
✅ Session management  
✅ Cosmic theme styling  
✅ Mobile responsive  
✅ Error handling  
✅ Loading states  

---

**Need help?** Check the full documentation in `AUTH_SETUP.md`
