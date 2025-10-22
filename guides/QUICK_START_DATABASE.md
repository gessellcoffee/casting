# Quick Start: Database Setup

## 🚀 Fast Track (5 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration
1. Open the file: `DATABASE_MIGRATION_APPROVALS_AND_NOTIFICATIONS.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Wait for "Success. No rows returned" message

### Step 3: Verify
Run this quick verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('company_approval_requests', 'notifications')
ORDER BY table_name;
```

You should see both tables listed.

### Step 4: Test the Application
1. Go to your Profile page
2. Click "Edit Profile"
3. Try adding a resume entry with a company from the dropdown
4. Click "Save"
5. It should work without errors! ✅

## ✅ What This Sets Up

- **Company Approvals**: Users can associate resume entries with companies
- **Notifications**: System-wide notification infrastructure
- **Security**: Row Level Security policies for data protection
- **Performance**: Indexes for fast queries

## 🆘 Troubleshooting

### "relation already exists"
✅ **This is fine!** It means the table was already created. The script is safe to run multiple times.

### "permission denied"
❌ Make sure you're logged into Supabase as the project owner.

### "foreign key constraint violation"
❌ Make sure these tables exist first:
- `profiles`
- `companies`
- `user_resume`

If they don't exist, you need to set up your base schema first.

### Still getting errors when saving resume entries?
Check the browser console (F12) for specific error messages and share them.

## 📚 More Information

- **Complete Guide**: See `DATABASE_SETUP_COMPLETE_GUIDE.md`
- **Approval System Details**: See `COMPANY_APPROVAL_SYSTEM.md`
- **Step-by-Step Migration**: See `DATABASE_MIGRATION_INSTRUCTIONS.md`

## 🎯 Expected Result

After running the migration, you should be able to:
- ✅ Add resume entries with company associations
- ✅ Edit existing resume entries
- ✅ See approval status indicators (pending/approved)
- ✅ Company owners can view approval requests
- ✅ Notifications work (when implemented in UI)

## Need Help?

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Review the error message in browser console (F12)
3. Verify all prerequisite tables exist
4. Check RLS policies aren't blocking your queries
