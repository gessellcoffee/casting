# Callback System - Neuromorphic Design Implementation

## Overview
All callback components have been updated with sleek neuromorphic design principles to match the app's cosmic aesthetic.

## Design Principles Applied

### 1. **Raised Elements (Outward Shadows)**
Used for interactive cards, buttons, and primary containers that "float" above the surface.

```css
shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]
```

**Applied to:**
- Stats cards
- Action cards (Create Slots, Select Auditionees, Manage Invitations)
- Primary buttons (Submit, Send Invitations)
- Main container cards
- Auditionee selection cards

### 2. **Inset Elements (Inward Shadows)**
Used for input fields, text areas, and nested containers that appear "pressed into" the surface.

```css
shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]
```

**Applied to:**
- All input fields (text, date, time, number)
- All select dropdowns
- All textarea fields
- Checkboxes
- Existing slots summary boxes
- Stats cards in invitations list
- Slot containers in invitations list
- Info/help sections

### 3. **Gradient Backgrounds**
Used for major container sections to add depth.

```css
bg-gradient-to-br from-[#2e3e5e] to-[#26364e]
```

**Applied to:**
- CallbackSlotCreator main container
- AuditioneeSelector main container
- CallbackInvitationsList main container

### 4. **Hover States**
Interactive elements have hover effects that transition from raised to inset.

```css
hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark),inset_-2px_-2px_5px_var(--cosmic-shadow-light)]
```

**Applied to:**
- Action cards
- Cancel buttons
- Add Another Slot button

### 5. **Primary Button Hover**
Primary action buttons have a darker inset shadow on hover.

```css
hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]
```

**Applied to:**
- Create Slots button
- Send Invitations button
- Manage Callbacks button (on audition detail page)

## Components Updated

### 1. **CallbackManagement.tsx**
- ✅ Stats cards (5 cards) - Raised shadows
- ✅ Action cards (3 cards) - Raised shadows with hover inset
- ✅ Getting Started info box - Inset shadow

### 2. **CallbackSlotCreator.tsx**
- ✅ Main container - Gradient background + raised shadow
- ✅ Existing slots summary - Inset shadow
- ✅ Error message box - Inset shadow with red tint
- ✅ Slot form containers - Inset shadows
- ✅ All input fields - Inset shadows
- ✅ All select dropdowns - Inset shadows
- ✅ All textareas - Inset shadows
- ✅ Add Another Slot button - Hover inset shadow
- ✅ Cancel button - Raised shadow with hover inset
- ✅ Submit button - Raised shadow with dark hover inset

### 3. **AuditioneeSelector.tsx**
- ✅ Empty state container - Raised shadow
- ✅ Main container - Gradient background + raised shadow
- ✅ Error message box - Inset shadow with red tint
- ✅ Search input - Inset shadow
- ✅ Role filter dropdown - Inset shadow
- ✅ Selection summary box - Inset shadow with blue tint
- ✅ Auditionee cards - Raised shadows (or inset when selected)
- ✅ Checkboxes - Inset shadow
- ✅ Callback slot dropdown - Inset shadow
- ✅ Casting notes textarea - Inset shadow
- ✅ Cancel button - Raised shadow with hover inset
- ✅ Send button - Raised shadow with dark hover inset

### 4. **CallbackInvitationsList.tsx**
- ✅ Empty state container - Raised shadow
- ✅ Main container - Gradient background + raised shadow
- ✅ Stats cards (4 cards) - Inset shadows
- ✅ Search input - Inset shadow
- ✅ Status filter dropdown - Inset shadow
- ✅ Slot filter dropdown - Inset shadow
- ✅ Slot containers - Inset shadows
- ✅ Invitation cards - Raised shadows

### 5. **Audition Detail Page**
- ✅ Manage Callbacks button - Raised shadow with dark hover inset

## Visual Hierarchy

### Level 1: Primary Containers
- Gradient backgrounds
- Large raised shadows
- Examples: Main component containers

### Level 2: Interactive Cards
- Solid backgrounds
- Medium raised shadows
- Hover transitions to inset
- Examples: Action cards, auditionee cards

### Level 3: Input Fields
- Inset shadows
- Appear recessed into surface
- Examples: All form inputs

### Level 4: Nested Information
- Inset shadows
- Subtle depth
- Examples: Stats cards, info boxes

## Color Palette

### Backgrounds
- `bg-[#2e3e5e]` - Primary container background
- `bg-[#26364e]` - Gradient end color
- `bg-[#1e2e4e]` - Nested/inset background
- `bg-[#2e3e5e]/50` - Semi-transparent overlay

### Borders
- `border-[#4a7bd9]/20` - Primary border
- `border-[#4a7bd9]/10` - Subtle border
- `border-[#5a8ff5]/50` - Hover/active border

### Text
- `text-[#c5ddff]` - Primary text
- `text-[#c5ddff]/70` - Secondary text
- `text-[#5a8ff5]` - Accent/link text

### Status Colors
- `text-yellow-400` / `bg-yellow-500/20` - Pending
- `text-green-400` / `bg-green-500/20` - Accepted
- `text-red-400` / `bg-red-500/10` - Rejected/Error

## CSS Variables Used

```css
--cosmic-shadow-dark: rgba(0, 0, 0, 0.3)
--cosmic-shadow-light: rgba(255, 255, 255, 0.05)
```

These variables should be defined in your global CSS for consistent shadowing across the app.

## Consistency Checklist

✅ All containers have appropriate shadows (raised or inset)  
✅ All input fields have inset shadows  
✅ All buttons have raised shadows  
✅ Hover states transition smoothly  
✅ Gradient backgrounds on major sections  
✅ Color palette is consistent  
✅ Border opacity matches design system  
✅ Text hierarchy uses proper opacity levels  

## Future Enhancements

### Potential Additions
1. **Loading States** - Add pulsing neuromorphic effect
2. **Disabled States** - Flatten shadows for disabled elements
3. **Focus States** - Add glow effect with neuromorphic shadows
4. **Animations** - Smooth shadow transitions on state changes
5. **Dark Mode Toggle** - Adjust shadow intensity for different themes

## Testing Recommendations

1. **Visual Testing**
   - Verify all shadows render correctly
   - Check hover states on all interactive elements
   - Ensure gradients display smoothly

2. **Accessibility**
   - Verify sufficient contrast ratios
   - Test keyboard navigation with focus states
   - Ensure shadows don't interfere with readability

3. **Responsive Testing**
   - Check shadow rendering on mobile devices
   - Verify touch targets have appropriate visual feedback
   - Test on different screen sizes

## Notes

- All neuromorphic effects use CSS custom properties for easy theming
- Shadows are optimized for performance (no excessive blur)
- Design maintains accessibility standards
- Consistent with existing app aesthetic
- Ready for production deployment

---

**Last Updated:** 2025-10-22  
**Design System Version:** 1.0  
**Status:** ✅ Complete
