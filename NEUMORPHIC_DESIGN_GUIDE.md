# Neumorphic Design System Guide

## Overview
This application now uses a modern neumorphic (soft UI) design system inspired by the reference design provided. The design features soft shadows, subtle depth, and a clean, minimalist aesthetic.

## Color Palette

### Background
- **Base**: `#e6eef9` - Light blue-grey base color
- **Gradient Start**: `#6b8dd6` - Soft blue
- **Gradient End**: `#e89cc5` - Soft pink/purple

### Surface Colors
- **Default**: `#e6eef9` - Same as base for seamless integration
- **Light**: `#f0f5fc` - Lighter variant
- **Dark**: `#dce6f5` - Darker variant

### Text Colors
- **Primary**: `#2d3748` - Dark grey for main text
- **Secondary**: `#4a5568` - Medium grey for secondary text
- **Muted**: `#718096` - Light grey for muted text

### Accent Colors
- **Primary**: `#6b8dd6` - Blue for primary actions
- **Secondary**: `#8b9dc3` - Muted blue for secondary actions
- **Success**: `#68d391` - Green for success states
- **Danger**: `#fc8181` - Red for danger/delete actions
- **Warning**: `#f6ad55` - Orange for warnings

## CSS Classes

### Buttons
- `.n-button-primary` - Primary action button
- `.n-button-secondary` - Secondary action button
- `.n-button-danger` - Destructive action button
- `.n-button-success` - Success/confirm button

### Cards & Containers
- `.card` - Standard card with neumorphic shadow
- `.neu-container` - General purpose container
- `.neu-stat-card` - Stat/metric card with hover effect

### Form Elements
- `.neu-input` - Text input with inset shadow
- `.neu-search` - Search bar with rounded corners
- `input[type="text"].neu-input` - Applies to all text inputs

### Icons & Small Elements
- `.neu-icon-btn` - Icon-only button (44x44px)
- `.neu-badge` - Small badge/tag element
- `.avatar` - User avatar with neumorphic styling

### Dropdowns & Menus
- `.neu-dropdown` - Dropdown container
- `.neu-dropdown-item` - Individual dropdown item

### Interactive Elements
- `.neu-toggle` - Toggle switch
- `.neu-progress` - Progress bar
- `.neu-progress-fill` - Progress bar fill

## Tailwind Utilities

### Colors
- `bg-neu-surface` - Surface background
- `text-neu-text-primary` - Primary text color
- `text-neu-text-secondary` - Secondary text color
- `text-neu-text-muted` - Muted text color
- `border-neu-border` - Standard border color

### Shadows
- `shadow-neu-raised` - Standard raised shadow
- `shadow-neu-raised-lg` - Large raised shadow
- `shadow-neu-pressed` - Inset/pressed shadow
- `shadow-neu-pressed-sm` - Small inset shadow

## Component Usage

### Button Component
```tsx
<Button 
  text="Click Me" 
  href="/path" 
  variant="primary" // primary | secondary | danger | success
/>
```

### Card Component
```tsx
<Card
  title="Card Title"
  description="Card description"
  imageSrc="/image.jpg"
  primaryButton={{ text: "Action", href: "/path", variant: "primary" }}
  secondaryButton={{ text: "Cancel", href: "/back", variant: "secondary" }}
/>
```

## Design Principles

### 1. Soft Shadows
Neumorphic design uses two shadows:
- **Light shadow** (top-left): Creates highlight
- **Dark shadow** (bottom-right): Creates depth

### 2. Subtle Depth
Elements appear to be extruded from or pressed into the surface:
- **Raised**: Default state with outset shadows
- **Pressed**: Active/focused state with inset shadows

### 3. Minimal Contrast
- Avoid harsh borders
- Use subtle color differences
- Rely on shadows for depth

### 4. Consistent Spacing
- Border radius: 12px-30px depending on element size
- Padding: 12px-24px for buttons, 1.5rem-2rem for cards
- Gaps: 0.75rem-1rem between elements

## Migration Notes

### Changes from Previous Design
1. **Background**: Changed from dark cosmic theme to light gradient
2. **Shadows**: Replaced glow effects with soft neumorphic shadows
3. **Colors**: Switched to light, muted color palette
4. **Stars**: Removed animated star background for clean aesthetic
5. **Text**: Updated all text colors to work with light background

### Components Updated
- ✅ `globals.css` - Complete neumorphic style system
- ✅ `tailwind.config.js` - Neumorphic color palette
- ✅ `Button.tsx` - Variant support and neumorphic styling
- ✅ `Card.tsx` - Clean neumorphic card design
- ✅ `NavigationBar.tsx` - Header with neumorphic elements
- ✅ `StarryContainer.tsx` - Simplified (no stars)
- ✅ `AuditionCard.tsx` - Updated colors and shadows
- ✅ `AuditionFilters.tsx` - Neumorphic container
- ✅ `auditions/page.tsx` - Updated text colors

## Browser Support
- Modern browsers with CSS custom properties support
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## Performance
- No animations on background (removed stars)
- CSS-only shadows (no JavaScript)
- Minimal repaints on hover states

## Accessibility
- Maintains WCAG AA contrast ratios
- Focus states clearly visible with border color changes
- Semantic HTML structure preserved
- Screen reader friendly

## Future Enhancements
- Dark mode variant (optional)
- Additional button sizes (sm, lg, xl)
- More badge variants
- Skeleton loading states
- Toast notifications with neumorphic styling
