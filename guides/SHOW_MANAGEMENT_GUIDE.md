# Show Management System Guide

## Overview

The Show Management System provides a comprehensive interface for creating, viewing, editing, and managing theatrical shows and their associated roles. This system is integrated with the casting workflow and allows users to organize all production data in one place.

## Features

### Show Management
- **Create Shows**: Add new theatrical productions with title, author, and description
- **View Shows**: Browse all shows in a searchable grid layout
- **Edit Shows**: Update show information (title, author, description)
- **Delete Shows**: Remove shows (with confirmation)
- **Search Shows**: Real-time search by show title with debounced input
- **Authorization**: Users can only edit/delete shows they created

### Role Management
- **Add Roles**: Create multiple roles for each show
- **Edit Roles**: Update role information inline
- **Delete Roles**: Remove roles with confirmation
- **Multiselect Delete**: Select multiple roles and delete them in bulk
- **Select All/Deselect All**: Quick selection of all roles
- **Role Properties**:
  - Role Name (required)
  - Role Type (Principal, Ensemble, Understudy, Crew, Other)
  - Gender (masculine, feminine, ungendered)
  - Description

## Pages

### Shows List Page (`/shows`)

**Location**: `src/app/shows/page.tsx`

**Features**:
- Grid view of all shows with cards
- Search bar with debounced input (300ms delay)
- Show statistics (role count, creation date)
- Quick actions (View Details, Delete)
- Empty state for no shows
- Loading states

**Components**:
- Search input with icon
- Show cards with:
  - Title and author
  - Description (truncated to 3 lines)
  - Role count and creation date
  - Action buttons

**User Actions**:
- Click "Create New Show" → Navigate to `/cast/new`
- Search shows → Filter results in real-time
- Click "View Details" → Navigate to `/shows/[id]`
- Click "Delete" → Confirm deletion → Remove show

### Show Detail Page (`/shows/[id]`)

**Location**: `src/app/shows/[id]/page.tsx`

**Features**:
- View complete show information
- Edit show details (for creators only)
- Manage all roles for the show
- Add new roles inline
- Edit existing roles inline
- Delete roles with confirmation
- Authorization checks

**Sections**:

1. **Show Information**
   - Title, author, description
   - Creation date and role count
   - Edit mode toggle (for creators)
   - Save/Cancel actions

2. **Roles Section**
   - List of all roles
   - Add new role button (for creators)
   - Inline role editing
   - Role cards with all properties
   - Multiselect mode for bulk operations
   - Empty state when no roles

**User Actions**:
- Click "Edit Show" → Enter edit mode
- Update fields → Click "Save Changes"
- Click "Add Role" → Show new role form
- Fill role details → Click "Save Role"
- Click "Edit" on role → Enter inline edit mode
- Update role → Click "Save"
- Click "Delete" on role → Confirm → Remove role
- Click "Select" → Enter multiselect mode
- Check roles → Click "Delete (n)" → Confirm → Remove selected roles
- Click "Select All" → Select all roles
- Click "Cancel" → Exit multiselect mode

## Database Schema

### Shows Table
```typescript
{
  show_id: string;           // UUID primary key
  title: string;             // Show title (required)
  author: string | null;     // Author/playwright name
  description: string | null; // Show description
  creator_user_id: string | null; // User who created the show
  created_at: string;        // Timestamp
}
```

### Roles Table
```typescript
{
  role_id: string;           // UUID primary key
  show_id: string;           // Foreign key to shows
  role_name: string;         // Role name (required)
  description: string | null; // Role description
  role_type: RoleType | null; // Principal, Ensemble, etc.
  gender: RoleGender | null;  // masculine, feminine, ungendered
}
```

### Relationships
- One show has many roles (one-to-many)
- Roles belong to one show (foreign key: `show_id`)
- Shows belong to one creator (foreign key: `creator_user_id`)

## API Functions

### Show Functions (`src/lib/supabase/shows.ts`)

#### `getShow(showId: string): Promise<Show | null>`
Fetch a single show by ID.

#### `getUserShows(userId: string): Promise<Show[]>`
Get all shows created by a specific user, ordered by creation date (newest first).

#### `getAllShows(): Promise<Show[]>`
Get all shows, ordered alphabetically by title.

#### `createShow(showData: ShowInsert): Promise<{ data: Show | null; error: any }>`
Create a new show. Automatically sets `creator_user_id` to authenticated user.

#### `updateShow(showId: string, updates: ShowUpdate): Promise<{ data: Show | null; error: any }>`
Update a show. Includes authorization check (user must be creator).

#### `deleteShow(showId: string): Promise<{ error: any }>`
Delete a show. Includes authorization check (user must be creator).

#### `searchShows(searchTerm: string): Promise<Show[]>`
Search shows by title using case-insensitive pattern matching. Limited to 20 results.

### Role Functions (`src/lib/supabase/roles.ts`)

#### `getRole(roleId: string): Promise<Role | null>`
Fetch a single role by ID.

#### `getShowRoles(showId: string): Promise<Role[]>`
Get all roles for a specific show, ordered alphabetically by role name.

#### `createRole(roleData: RoleInsert): Promise<{ data: Role | null; error: any }>`
Create a new role.

#### `createRoles(rolesData: RoleInsert[]): Promise<{ data: Role[] | null; error: any }>`
Create multiple roles at once (batch insert).

#### `updateRole(roleId: string, updates: RoleUpdate): Promise<{ data: Role | null; error: any }>`
Update a role.

#### `deleteRole(roleId: string): Promise<{ error: any }>`
Delete a role.

#### `deleteShowRoles(showId: string): Promise<{ error: any }>`
Delete all roles for a show.

#### `showHasRoles(showId: string): Promise<boolean>`
Check if a show has any roles.

#### `getShowRoleCount(showId: string): Promise<number>`
Get the total number of roles for a show.

## Authorization

### Show Authorization
- **View**: All authenticated users can view all shows
- **Create**: All authenticated users can create shows
- **Edit**: Only the creator can edit their own shows
- **Delete**: Only the creator can delete their own shows

### Role Authorization
- **View**: All authenticated users can view all roles
- **Create**: Only the show creator can add roles to their shows
- **Edit**: Only the show creator can edit roles in their shows
- **Delete**: Only the show creator can delete roles from their shows

## UI/UX Features

### Design System
- **Color Scheme**: Cosmic theme with blues and purples
- **Neumorphic Design**: Soft shadows and gradients
- **Responsive**: Mobile-first design with breakpoints
- **Animations**: Smooth transitions and hover effects

### User Feedback
- **Loading States**: Spinners and loading text
- **Empty States**: Helpful messages with icons
- **Error Handling**: Alert dialogs for errors
- **Confirmation Dialogs**: Delete confirmations
- **Disabled States**: Buttons disabled during save operations

### Search Optimization
- **Debounced Input**: 300ms delay to reduce API calls
- **Real-time Results**: Updates as you type
- **Clear Feedback**: Shows search results or "no results" message

## Integration with Casting Workflow

### Cast Creation Flow
When creating a new audition/cast:
1. User selects or creates a show
2. System loads roles for that show
3. User can manage roles during cast creation
4. Roles are associated with auditions

### Role Usage
- Roles are used in audition creation
- Actors audition for specific roles
- Casting decisions are made per role
- Role information is displayed in audition listings

## Testing

### Unit Tests (`src/lib/supabase/__tests__/shows.test.ts`)

**Test Coverage**:
- ✅ `getShow` - Fetch show by ID
- ✅ `getUserShows` - Fetch user's shows
- ✅ `getAllShows` - Fetch all shows
- ✅ `createShow` - Create new show with auth
- ✅ `updateShow` - Update show with authorization
- ✅ `deleteShow` - Delete show with authorization
- ✅ `searchShows` - Search shows by title
- ✅ Error handling for all functions
- ✅ Authorization checks

### Role Tests (`src/lib/supabase/__tests__/roles.test.ts`)

**Test Coverage**:
- ✅ All CRUD operations for roles
- ✅ Batch operations
- ✅ Role counting and checking
- ✅ Error handling

## Best Practices

### Performance
1. **Debounced Search**: Reduces unnecessary API calls
2. **Batch Loading**: Load role counts in parallel
3. **Optimistic Updates**: UI updates before server confirmation
4. **Lazy Loading**: Only load data when needed

### Security
1. **Authorization Checks**: Server-side validation of user permissions
2. **Input Validation**: Required fields enforced
3. **SQL Injection Protection**: Parameterized queries via Supabase
4. **XSS Protection**: React's built-in escaping

### Code Quality
1. **TypeScript**: Full type safety
2. **Reusable Components**: RoleCard component
3. **Error Handling**: Comprehensive error messages
4. **Clean Code**: Well-organized, readable functions

## Common Use Cases

### Creating a New Show
1. Navigate to `/shows`
2. Click "Create New Show"
3. Fill in show details (title, author, description)
4. Add roles one by one
5. Save and proceed

### Editing Show Information
1. Navigate to `/shows`
2. Click "View Details" on a show you created
3. Click "Edit Show"
4. Update fields
5. Click "Save Changes"

### Managing Roles
1. Navigate to show detail page
2. Click "Add Role" to create new roles
3. Click "Edit" on existing roles to modify
4. Click "Delete" to remove roles
5. All changes save immediately

### Bulk Deleting Roles (Multiselect)
1. Navigate to show detail page
2. Click "Select" button to enter multiselect mode
3. Check the boxes next to roles you want to delete
4. Or click "Select All" to select all roles
5. Click "Delete (n)" button where n is the count
6. Confirm the deletion
7. Selected roles are removed and select mode exits

**Multiselect Features**:
- **Visual Feedback**: Selected roles are highlighted with blue border and background
- **Checkbox Interface**: Click checkboxes or role cards to toggle selection
- **Select All/Deselect All**: Toggle button changes based on selection state
- **Delete Count**: Button shows number of selected roles
- **Cancel Anytime**: Exit select mode without deleting
- **Disabled State**: Delete button disabled when no roles selected
- **Batch Processing**: All deletions happen in parallel for speed
- **Error Handling**: Shows count of failed deletions if any occur

### Searching for Shows
1. Navigate to `/shows`
2. Type in the search bar
3. Results filter automatically
4. Clear search to see all shows

## Troubleshooting

### Show Not Loading
- Check user authentication
- Verify show_id is valid
- Check browser console for errors
- Ensure RLS policies allow access

### Cannot Edit Show
- Verify you are the show creator
- Check authentication status
- Ensure you're logged in with correct account

### Roles Not Appearing
- Verify roles exist in database
- Check show_id foreign key relationship
- Ensure RLS policies allow role access

### Search Not Working
- Check network connection
- Verify search query is valid
- Clear browser cache
- Check for JavaScript errors

## Future Enhancements

### Potential Features
- [ ] Bulk role import (CSV/Excel)
- [ ] Role templates for common show types
- [ ] Show duplication/cloning
- [ ] Advanced filtering (by author, date, role count)
- [ ] Show archiving
- [ ] Collaborative editing (multiple creators)
- [ ] Role assignment tracking
- [ ] Show statistics dashboard
- [ ] Export show data
- [ ] Show categories/tags

### Performance Improvements
- [ ] Pagination for large show lists
- [ ] Virtual scrolling for roles
- [ ] Caching strategy
- [ ] Optimistic UI updates
- [ ] Background sync

## Navigation

The Show Management system is accessible via:
- **Main Navigation**: "Shows" button in header
- **Direct URL**: `/shows` (list) and `/shows/[id]` (detail)
- **Cast Creation**: Integrated into audition creation flow

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in browser console
3. Verify database schema matches expectations
4. Check authentication and authorization
5. Review RLS policies in Supabase
