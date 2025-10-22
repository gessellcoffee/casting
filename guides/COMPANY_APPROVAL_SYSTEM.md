# Company Approval System - Implementation Summary

## Overview
Implemented a comprehensive company approval system that allows users to select companies from a dropdown when adding resume entries. When a company is selected, the company owner receives a notification and can approve or reject the association.

## Database Schema Updates

### Updated Tables

#### 1. `user_resume` Table - New Fields
```sql
ALTER TABLE user_resume 
ADD COLUMN company_id UUID REFERENCES companies(company_id),
ADD COLUMN company_approved BOOLEAN DEFAULT NULL;

-- company_name: Existing varchar field for manual entry
-- company_id: New UUID field for company reference
-- company_approved: NULL (pending), TRUE (approved), FALSE (rejected)
```

#### 2. `company_approval_requests` Table - NEW
```sql
CREATE TABLE company_approval_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_entry_id UUID NOT NULL REFERENCES user_resume(resume_entry_id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_company_approval_requests_company_id ON company_approval_requests(company_id);
CREATE INDEX idx_company_approval_requests_status ON company_approval_requests(status);
CREATE INDEX idx_company_approval_requests_user_id ON company_approval_requests(user_id);
```

## Files Created/Modified

### 1. Type Definitions (`src/lib/supabase/types.ts`)
- Updated `user_resume` table types to include `company_id` and `company_approved`
- Added `company_approval_requests` table types
- Added type exports: `CompanyApprovalRequest`, `CompanyApprovalRequestInsert`, `CompanyApprovalRequestUpdate`

### 2. Company Approvals Module (`src/lib/supabase/companyApprovals.ts`) - NEW FILE
Created comprehensive approval management functions:

#### Functions:
- **`createApprovalRequest(resumeEntryId, companyId, userId)`** - Create approval request when user selects company
- **`getCompanyApprovalRequests(companyId)`** - Get all requests for a specific company
- **`getUserPendingApprovalRequests()`** - Get all pending requests for companies owned by current user
- **`updateApprovalRequest(requestId, status)`** - Approve or reject a request
- **`hasPendingApprovalRequest(resumeEntryId)`** - Check if entry has pending request
- **`getApprovalRequestStatus(resumeEntryId)`** - Get current approval status

**Security Features:**
- All operations verify user authentication
- Users can only create requests for themselves
- Only company owners can approve/reject requests for their companies
- Automatic update of `company_approved` field when approved

### 3. Resume Module Updates (`src/lib/supabase/resume.ts`)
- **`createResumeEntry`** - Automatically creates approval request when `company_id` is provided
- **`updateResumeEntry`** - Creates new approval request when company is changed, resets approval status

### 4. Company Module Updates (`src/lib/supabase/company.ts`)
- **`getAllCompanies()`** - NEW - Returns all companies for dropdown selection

### 5. Resume Entry Component (`src/components/ResumeEntry.tsx`)
**Major Updates:**
- Added company dropdown with toggle between manual entry and company selection
- Loads all companies for dropdown
- Shows notification message when company is selected
- Displays approval status icons:
  - ✅ Green checkmark: Approved by company OR verified from application
  - ⏱️ Yellow clock: Pending company approval
- Handles both `company_name` (manual) and `company_id` (dropdown) fields

### 6. Resume Section Component (`src/components/ResumeSection.tsx`)
**Major Updates:**
- Added company dropdown to new entry form
- Toggle between manual entry and company selection
- Loads companies on component mount
- Shows notification when company is selected

### 7. Approvals Page (`src/app/approvals/page.tsx`) - NEW FILE
Complete approval management interface:
- Lists all pending approval requests for user's companies
- Shows requester details (name, photo)
- Shows production details (show, role, date)
- Approve/Reject buttons with confirmation
- Real-time updates after approval/rejection
- Empty state message when no pending requests

### 8. Navigation Bar (`src/components/NavigationBar.tsx`)
- Added "Approvals" link to desktop navigation (visible when logged in)
- Added "Approvals" link to mobile navigation menu (visible when logged in)

### 9. Index Export (`src/lib/supabase/index.ts`)
- Added export for `companyApprovals` module

## User Workflow

### For Resume Owners (Actors/Performers):

1. **Adding a Resume Entry:**
   - Go to Profile page
   - Click "Add Entry" in Resume section
   - Toggle "Select from list" to choose from company dropdown
   - Select a company from the dropdown
   - See notification: "ⓘ Company owner will be notified for approval"
   - Fill in show details (show name, role, date)
   - Click "Add Entry"

2. **Approval Status:**
   - **Pending**: Yellow clock icon appears next to show name
   - **Approved**: Green checkmark appears (same as application-verified entries)
   - **Rejected**: No icon, entry remains but without verification

3. **Editing Entries:**
   - Can switch between manual company name and company dropdown
   - Changing company creates a new approval request
   - Approval status resets when company is changed

### For Company Owners:

1. **Receiving Notifications:**
   - Click "Approvals" in navigation bar
   - See list of pending approval requests
   - Each request shows:
     - User's name and photo
     - Company name
     - Show/production details
     - Role and date
     - Request date

2. **Approving/Rejecting:**
   - Click "Approve" to verify the association
     - Entry gets green checkmark
     - Request removed from pending list
   - Click "Reject" to deny the association
     - Entry remains but without verification
     - Request removed from pending list

## Visual Indicators

### Resume Entry Icons:
- **✅ Green Checkmark**: 
  - Entry verified from application source, OR
  - Company owner has approved the association
  - Tooltip: "Approved by company" or "Verified from application"

- **⏱️ Yellow Clock**:
  - Company selected but approval pending
  - Tooltip: "Pending company approval"

- **No Icon**:
  - Manual company entry (no verification needed), OR
  - Company rejected the association

## Security & Authorization

### Resume Operations:
- Users can only create/edit their own resume entries
- Approval requests automatically created when company is selected
- Users cannot manually set `company_approved` status

### Approval Operations:
- Only company owners can approve/reject requests for their companies
- Users cannot approve their own requests
- All operations verify authentication and ownership

### Data Integrity:
- Foreign key constraints ensure data consistency
- Cascade deletes handle cleanup when entries/companies are deleted
- Status field constrained to valid values ('pending', 'approved', 'rejected')

## API Examples

### Creating Resume Entry with Company:
```typescript
const { data, error } = await createResumeEntry({
  user_id: userId,
  show_name: 'Hamlet',
  role: 'Ophelia',
  company_id: 'company-uuid-here', // Triggers approval request
  date_of_production: '2024',
});
// Approval request automatically created
```

### Approving a Request:
```typescript
const { data, error } = await updateApprovalRequest(requestId, 'approved');
// Updates request status AND sets company_approved = true on resume entry
```

### Getting Pending Requests:
```typescript
const requests = await getUserPendingApprovalRequests();
// Returns all pending requests for companies owned by current user
```

## Database Migration Script

```sql
-- Step 1: Add new columns to user_resume
ALTER TABLE user_resume 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(company_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS company_approved BOOLEAN DEFAULT NULL;

-- Step 2: Create company_approval_requests table
CREATE TABLE IF NOT EXISTS company_approval_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_entry_id UUID NOT NULL REFERENCES user_resume(resume_entry_id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_approval_requests_company_id 
  ON company_approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_company_approval_requests_status 
  ON company_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_approval_requests_user_id 
  ON company_approval_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_company_approval_requests_resume_entry_id 
  ON company_approval_requests(resume_entry_id);

-- Step 4: Add foreign key constraint for company_id in user_resume
ALTER TABLE user_resume 
ADD CONSTRAINT user_resume_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL;
```

## Testing Checklist

### Manual Testing:
- [ ] User can select company from dropdown
- [ ] Approval request is created when company is selected
- [ ] Company owner sees pending request in Approvals page
- [ ] Company owner can approve request
- [ ] Green checkmark appears after approval
- [ ] Company owner can reject request
- [ ] User can toggle between manual entry and dropdown
- [ ] Changing company creates new approval request
- [ ] Approval status resets when company changes
- [ ] Icons display correctly (checkmark, clock)
- [ ] Empty state shows when no pending requests

### Unit Testing:
- [ ] Test approval request creation
- [ ] Test unauthorized approval attempts
- [ ] Test approval/rejection workflow
- [ ] Test company owner verification
- [ ] Test cascade deletes

## Future Enhancements

1. **Email Notifications**: Send email to company owner when approval request is created
2. **Push Notifications**: Real-time notifications in the app
3. **Approval History**: View past approved/rejected requests
4. **Bulk Approvals**: Approve multiple requests at once
5. **Request Comments**: Allow users to add notes to approval requests
6. **Auto-Approval**: Option for companies to auto-approve certain users
7. **Approval Analytics**: Track approval rates and response times
8. **Request Expiration**: Auto-expire old pending requests
