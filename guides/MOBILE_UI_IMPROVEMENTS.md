# Mobile UI Improvements

## RolesList Component

### Changes Made

#### 1. **Role Name & Badges Layout**
**Before:** Role name and badges (Principal, Masculine, etc.) displayed on same line, causing cramping on mobile

**After:** 
- **Mobile (< 640px)**: Stacked vertically with role name on top, badges below
- **Desktop (≥ 640px)**: Horizontal layout maintained

```tsx
// Mobile: flex-col, Desktop: flex-row
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
  <h3>Role Name</h3>
  <div className="flex flex-wrap gap-2">
    {/* Badges */}
  </div>
</div>
```

#### 2. **Badge Improvements**
- Added `whitespace-nowrap` to prevent badge text wrapping
- Added `flex-wrap` to badge container for better multi-badge handling
- Maintains neumorphic design with inset shadows

#### 3. **Cast Member Badges**
**Improvements:**
- Increased padding: `py-1.5` → `py-2` for better touch targets
- Responsive avatar sizes: `w-6 h-6` on mobile, `w-7 h-7` on desktop
- Responsive text: `text-sm` on mobile, `text-base` on desktop
- Added `flex-shrink-0` to avatars to prevent squishing
- Added `font-medium` for better readability
- Added `tracking-wide` to section labels (CAST, UNDERSTUDY)

#### 4. **Header Responsiveness**
- Title: `text-xl` on mobile, `text-2xl` on desktop
- Dropdown arrow: `text-lg` on mobile, `text-xl` on desktop

### Responsive Breakpoints

Using Tailwind's default breakpoints:
- **Mobile**: `< 640px` (default styles)
- **Tablet/Desktop**: `≥ 640px` (sm: prefix)

### Visual Result

**Mobile View:**
```
┌─────────────────────────┐
│ Baker                   │
│ [Principal] [Feminine]  │
│                         │
│ Description...          │
│ ─────────────────────   │
│ CAST                    │
│ [👤 John Doe]           │
└─────────────────────────┘
```

**Desktop View:**
```
┌──────────────────────────────────────────┐
│ Baker              [Principal] [Feminine] │
│                                           │
│ Description...                            │
│ ────────────────────────────────────────  │
│ CAST                                      │
│ [👤 John Doe]                             │
└──────────────────────────────────────────┘
```

## Benefits

1. **Better Readability**: Role names no longer cramped next to badges
2. **Touch-Friendly**: Larger touch targets for cast member buttons
3. **Flexible Layout**: Badges wrap naturally when multiple present
4. **Consistent Spacing**: Proper gap between elements on all screen sizes
5. **Maintains Design**: Neumorphic styling preserved across breakpoints

## Future Mobile Improvements

Potential areas for further mobile optimization:
- Audition details page layout
- Callback management interface
- Calendar/schedule views
- Navigation menu (already has mobile menu)
- Form inputs and modals
- Table layouts (consider card view on mobile)
