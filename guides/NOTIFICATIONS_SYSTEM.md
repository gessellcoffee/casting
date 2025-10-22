# Notifications System - Implementation Summary

## Overview
Implemented a comprehensive, scalable notifications system with a dropdown UI that replaces the standalone approvals page. The system supports multiple notification types and is designed to handle future features like user affiliations and casting decisions.

## Key Features

✅ **Unified Notification Center** - Single dropdown for all notification types  
✅ **Real-time Badge** - Unread count displayed on bell icon  
✅ **Multiple Notification Types** - Company approvals, user affiliations, casting decisions, general  
✅ **Actionable Notifications** - Approve/reject directly from dropdown  
✅ **Mark as Read** - Individual or bulk mark as read  
✅ **Extensible Design** - Easy to add new notification types  
✅ **Security** - Users can only see and act on their own notifications  

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('company_approval', 'user_affiliation', 'casting_decision', 'general')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  reference_id UUID,
  reference_type VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  is_actionable BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, is_read);
```

### Field Descriptions

- **notification_id**: Unique identifier
- **recipient_id**: User receiving the notification
- **sender_id**: User who triggered the notification (nullable)
- **type**: Notification category (company_approval, user_affiliation, casting_decision, general)
- **title**: Short notification title
- **message**: Detailed notification message
- **action_url**: Optional URL to navigate to (for future use)
- **reference_id**: ID of the related entity (e.g., approval request ID)
- **reference_type**: Type of the related entity (e.g., 'company_approval_request')
- **is_read**: Whether notification has been read
- **is_actionable**: Whether notification requires user action
- **action_taken**: Action taken by user (e.g., 'approved', 'rejected')
- **created_at**: When notification was created
- **read_at**: When notification was read

## Files Created/Modified

### 1. Type Definitions (`src/lib/supabase/types.ts`)
- Added `notifications` table types
- Added type exports: `Notification`, `NotificationInsert`, `NotificationUpdate`, `NotificationType`

### 2. Notifications Module (`src/lib/supabase/notifications.ts`) - NEW FILE
Comprehensive notification management functions:

#### Core Functions:
- **`createNotification(data)`** - Create a new notification
- **`getUserNotifications(userId, limit)`** - Get user's notifications with sender details
- **`getUnreadNotificationCount(userId)`** - Get count of unread notifications
- **`markNotificationAsRead(notificationId)`** - Mark single notification as read
- **`markAllNotificationsAsRead(userId)`** - Mark all user's notifications as read
- **`deleteNotification(notificationId)`** - Delete a notification
- **`handleNotificationAction(notificationId, action)`** - Record action taken on notification

#### Helper Functions:
- **`createCompanyApprovalNotification(...)`** - Create company approval notification with proper formatting

**Security Features:**
- All operations verify user authentication
- Users can only access their own notifications
- Authorization checks prevent unauthorized actions

### 3. Company Approvals Update (`src/lib/supabase/companyApprovals.ts`)
- Automatically creates notification when approval request is made
- Fetches company and resume details for notification message

### 4. Notifications Dropdown Component (`src/components/NotificationsDropdown.tsx`) - NEW FILE
Complete notification UI with:
- **Bell Icon** with unread count badge
- **Dropdown Panel** with scrollable notification list
- **Notification Cards** with icons, titles, messages, timestamps
- **Action Buttons** for actionable notifications (Approve/Reject)
- **Mark as Read** functionality (individual and bulk)
- **Empty State** when no notifications
- **Loading State** while fetching
- **Click Outside** to close dropdown
- **Type-specific Icons** for different notification types

### 5. Navigation Bar (`src/components/NavigationBar.tsx`)
- Removed "Approvals" link
- Added `NotificationsDropdown` component to desktop nav
- Positioned next to user avatar

### 6. Index Export (`src/lib/supabase/index.ts`)
- Added export for `notifications` module

## Notification Types

### 1. Company Approval (`company_approval`)
**Icon:** Building/Company icon  
**Triggered When:** User selects a company for their resume entry  
**Recipient:** Company owner  
**Actionable:** Yes (Approve/Reject)  
**Example:**
```
Title: "Company Approval Request"
Message: ""Hamlet" (Ophelia) wants to be associated with Shakespeare Theater Company"
```

### 2. User Affiliation (`user_affiliation`) - Future
**Icon:** Users/People icon  
**Triggered When:** User requests to affiliate with another user  
**Recipient:** User being requested  
**Actionable:** Yes (Accept/Decline)  

### 3. Casting Decision (`casting_decision`) - Future
**Icon:** Video/Camera icon  
**Triggered When:** Casting director makes a decision on an audition  
**Recipient:** Auditioning user  
**Actionable:** No (Informational)  

### 4. General (`general`)
**Icon:** Info icon  
**Triggered When:** System messages, announcements, etc.  
**Recipient:** Varies  
**Actionable:** No  

## User Experience

### Viewing Notifications:
1. Click bell icon in navigation bar
2. Dropdown opens showing recent notifications
3. Unread notifications have blue dot indicator
4. Unread count badge shows on bell icon

### Reading Notifications:
- Click on notification to mark as read
- Or click "Mark all as read" to clear all unread

### Acting on Notifications:
1. For company approvals, see "Approve" and "Reject" buttons
2. Click button to take action
3. Notification updates to show action taken
4. Resume entry gets checkmark if approved

### Notification States:
- **Unread**: Blue dot, highlighted background
- **Read**: No dot, normal background
- **Action Taken**: Shows badge (✓ Approved or ✗ Rejected)

## API Examples

### Creating a Notification:
```typescript
const { data, error } = await createNotification({
  recipient_id: 'user-id',
  sender_id: 'sender-id',
  type: 'company_approval',
  title: 'Company Approval Request',
  message: 'User wants to add your company to their resume',
  reference_id: 'approval-request-id',
  reference_type: 'company_approval_request',
  is_actionable: true,
});
```

### Getting User Notifications:
```typescript
const notifications = await getUserNotifications(userId, 20);
// Returns array of notifications with sender details
```

### Handling Actions:
```typescript
// Approve a company approval request
await updateApprovalRequest(requestId, 'approved');
await handleNotificationAction(notificationId, 'approved');
```

## Database Migration

```sql
-- Step 1: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  type VARCHAR(50) NOT NULL CHECK (type IN ('company_approval', 'user_affiliation', 'casting_decision', 'general')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  reference_id UUID,
  reference_type VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  is_actionable BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT notifications_recipient_id_fkey 
    FOREIGN KEY (recipient_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT notifications_sender_id_fkey 
    FOREIGN KEY (sender_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id 
  ON notifications(recipient_id);
  
CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications(is_read);
  
CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type);
  
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
  ON notifications(recipient_id, is_read);

-- Step 3: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = recipient_id);
```

## Adding New Notification Types

To add a new notification type (e.g., for user affiliations):

### 1. Update Type Definition:
```typescript
// In types.ts
type: 'company_approval' | 'user_affiliation' | 'casting_decision' | 'general' | 'your_new_type'
```

### 2. Create Helper Function:
```typescript
// In notifications.ts
export async function createYourNewTypeNotification(
  recipientId: string,
  senderId: string,
  ...otherParams
): Promise<{ data: Notification | null; error: any }> {
  return createNotification({
    recipient_id: recipientId,
    sender_id: senderId,
    type: 'your_new_type',
    title: 'Your Title',
    message: 'Your message',
    is_actionable: true, // if it requires action
  });
}
```

### 3. Add Icon in Dropdown:
```typescript
// In NotificationsDropdown.tsx, add to getNotificationIcon()
case 'your_new_type':
  return <YourCustomIcon />;
```

### 4. Handle Actions (if actionable):
```typescript
// In NotificationsDropdown.tsx, add handler
const handleYourAction = async (notification: any) => {
  // Your action logic
  await handleNotificationAction(notification.notification_id, 'action_name');
};
```

## Benefits Over Previous Approvals Page

1. **Better UX**: No need to navigate to separate page
2. **Real-time Awareness**: Unread count always visible
3. **Faster Actions**: Approve/reject without page navigation
4. **Scalable**: Easy to add new notification types
5. **Unified**: All notifications in one place
6. **Mobile Friendly**: Dropdown works well on all screen sizes

## Future Enhancements

1. **Real-time Updates**: Use Supabase Realtime subscriptions for instant notifications
2. **Email Notifications**: Send email for important notifications
3. **Push Notifications**: Browser push notifications
4. **Notification Preferences**: Let users choose which notifications to receive
5. **Notification Grouping**: Group similar notifications together
6. **Rich Media**: Support images/videos in notifications
7. **Notification History**: Archive and search old notifications
8. **Sound Alerts**: Optional sound when new notification arrives
9. **Desktop Notifications**: OS-level notifications
10. **Notification Templates**: Reusable templates for common notification types

## Testing Checklist

- [ ] Notification created when approval request is made
- [ ] Unread count updates correctly
- [ ] Bell icon shows badge with count
- [ ] Dropdown opens/closes properly
- [ ] Click outside closes dropdown
- [ ] Notifications load correctly
- [ ] Mark as read works (individual)
- [ ] Mark all as read works
- [ ] Approve button works and updates UI
- [ ] Reject button works and updates UI
- [ ] Action taken badge shows correctly
- [ ] Empty state displays when no notifications
- [ ] Loading state shows while fetching
- [ ] Icons display correctly for each type
- [ ] Timestamps format correctly
- [ ] Security: Users can only see their own notifications
- [ ] Security: Users can only act on their own notifications
