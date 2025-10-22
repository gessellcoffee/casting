# Neuromorphic Design Updates

This document summarizes the neuromorphic design styling applied to the audition signup components.

## Design System Overview

The application uses a cosmic-themed neuromorphic design with the following key characteristics:

### Color Palette
- **Base Colors**: `#2e3e5e` (cosmic-surface), `#26364e` (cosmic-surface-dark)
- **Accent Colors**: `#4a7bd9` (cosmic-accent), `#5a8ff5` (cosmic-glow)
- **Text Colors**: `#c5ddff` (cosmic-mist), `#94b0f6` (cosmic-lilac)
- **Shadows**: 
  - Dark: `rgba(10, 15, 26, 0.6)`
  - Light: `rgba(58, 68, 106, 0.4)`

### Neuromorphic Effects
- **Outset Shadow**: `3px 3px 6px var(--cosmic-shadow-dark), -3px -3px 6px var(--cosmic-shadow-light)`
- **Inset Shadow**: `inset 3px 3px 6px var(--cosmic-shadow-dark), inset -3px -3px 6px var(--cosmic-shadow-light)`
- **Gradient Background**: `linear-gradient(145deg, var(--cosmic-surface), var(--cosmic-surface-dark))`

## Component Updates

### SlotsList Component (`src/components/auditions/SlotsList.tsx`)

#### 1. Buttons
All buttons now use the neuromorphic button classes:

**Primary Button** (Sign Up):
```tsx
className="n-button-primary px-4 py-2 rounded-lg font-medium"
```
- Uses neuromorphic shadows
- Hover state: inset shadows with glow effect
- Disabled state: 50% opacity

**Danger Button** (Cancel Signup):
```tsx
className="n-button-danger px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"
```
- Red color theme on hover
- Neuromorphic shadows
- Disabled state handled by class

#### 2. Info Boxes

**Error Messages**:
```tsx
className="mb-4 p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-red-500/30 text-red-300 text-sm shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)]"
```
- Gradient background with cosmic colors
- Red border for error state
- Neuromorphic outset shadow

**User Signup Info Box**:
```tsx
className="mb-4 p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)]"
```
- Blue accent border (`cosmic-glow`)
- Cosmic text colors
- Neuromorphic outset shadow
- Title in `#5a8ff5` (cosmic-glow)

**Success Messages**:
```tsx
className="mb-4 p-4 rounded-xl bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-green-500/30 text-green-300 shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)]"
```
- Green border for success state
- Neuromorphic outset shadow
- Close button with hover transition to cosmic-glow

#### 3. Slot Cards

**Signed Up Badge**:
```tsx
className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-green-500/30 text-green-300 font-medium shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)]"
```
- Inset shadow for pressed appearance
- Green border and text
- Gradient background

**Time Conflict Warning**:
```tsx
className="flex items-center gap-1 text-orange-300 text-xs mt-1"
```
- Orange color for warning state
- Consistent with cosmic color palette

## Design Principles Applied

1. **Consistency**: All interactive elements use the same neuromorphic button classes
2. **Visual Hierarchy**: Different shadow types (outset vs inset) indicate different states
3. **Color Semantics**: 
   - Blue/Cosmic colors for primary actions and info
   - Red for destructive actions and errors
   - Green for success and confirmation
   - Orange for warnings
4. **Accessibility**: Disabled states clearly indicated with opacity
5. **Smooth Transitions**: All hover states include transition effects

## CSS Classes Reference

### Neuromorphic Button Classes (from `globals.css`)

- `.n-button-primary`: Default action button with cosmic-glow hover
- `.n-button-secondary`: Alternative action with gold hover
- `.n-button-danger`: Destructive action with red hover

All button classes include:
- Base neuromorphic shadows
- Hover state with inset shadows and glow
- Active state with deeper inset shadows
- Disabled state with 50% opacity

### Custom Tailwind Extensions

The design uses Tailwind's CSS variable system for consistent theming:
- `var(--cosmic-shadow-dark)`: Dark shadow component
- `var(--cosmic-shadow-light)`: Light shadow component
- `var(--cosmic-surface)`: Base surface color
- `var(--cosmic-surface-dark)`: Darker surface variant
- `var(--cosmic-glow)`: Primary accent color

## Testing Considerations

The lint errors for `vitest` and `@testing-library/react` in test files are expected - these are dev dependencies and don't affect the runtime application. The test file structure follows the project's testing patterns.

## Future Enhancements

To maintain consistency across the application:
1. Apply these same patterns to other audition-related components
2. Consider creating reusable alert/notification components with these styles
3. Document any new neuromorphic patterns in this file
4. Ensure all new interactive elements use the `.n-button-*` classes
