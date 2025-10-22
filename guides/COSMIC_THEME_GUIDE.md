# Cosmic Theme Color Guide - Deep Blue Edition

## Tailwind Config Colors

All cosmic colors are now available in your Tailwind config and can be used with Tailwind utility classes:

### Color Palette (Deep Blue Theme)

```javascript
cosmic: {
  base: '#2a3a5a',           // Base cosmic deep blue
  light: '#3a4a7a',          // Lighter variant
  dark: '#1a2a4a',           // Darker variant
  darker: '#0f1929',         // Even darker
  deepest: '#0a0f1a',        // Deepest dark
  accent: '#4a7bd9',         // Bright blue accent
  glow: '#5a8ff5',           // Bright blue glow
  purple: '#1e3ae8',         // Vivid blue
  lavender: '#b5ccff',       // Light blue-lavender
  lilac: '#94b0f6',          // Soft blue-lilac
  mist: '#c5ddff',           // Misty blue
  surface: '#2e3e5e',        // Surface gradient start
  surfaceDark: '#26364e',    // Surface gradient end
  bg: {
    start: '#0f1929',        // Background gradient start (deep navy)
    mid: '#1a2a3e',          // Background gradient middle (midnight blue)
    end: '#24344e',          // Background gradient end (slate blue)
  },
  shadow: {
    dark: 'rgba(10, 15, 26, 0.6)',   // Dark shadow for neuromorphic
    light: 'rgba(58, 68, 106, 0.4)', // Light shadow for neuromorphic
  },
}
```

## Usage in Tailwind Classes

### Text Colors
```jsx
<h1 className="text-cosmic-glow">Glowing Title</h1>
<p className="text-cosmic-lavender">Lavender text</p>
<span className="text-cosmic-accent">Accent text</span>
```

### Background Colors
```jsx
<div className="bg-cosmic-base">Base background</div>
<div className="bg-cosmic-surface">Surface background</div>
<div className="bg-cosmic-bg-mid">Mid gradient background</div>
```

### Border Colors
```jsx
<div className="border border-cosmic-accent">Accent border</div>
<div className="border-2 border-cosmic-glow">Glow border</div>
```

### Gradients
```jsx
<div className="bg-gradient-to-r from-cosmic-lavender via-cosmic-glow to-cosmic-lilac">
  Gradient background
</div>
```

## CSS Custom Properties

All colors are also available as CSS variables for use in custom CSS:

```css
var(--cosmic-base)
var(--cosmic-light)
var(--cosmic-dark)
var(--cosmic-darker)
var(--cosmic-deepest)
var(--cosmic-accent)
var(--cosmic-glow)
var(--cosmic-purple)
var(--cosmic-surface)
var(--cosmic-surface-dark)
var(--cosmic-lavender)
var(--cosmic-lilac)
var(--cosmic-mist)
var(--cosmic-bg-start)
var(--cosmic-bg-mid)
var(--cosmic-bg-end)
var(--cosmic-shadow-dark)
var(--cosmic-shadow-light)
```

## Neuromorphic Shadows

The neuromorphic raised effect is maintained using:
- **Raised state**: `box-shadow: 10px 10px 20px var(--cosmic-shadow-dark), -10px -10px 20px var(--cosmic-shadow-light)`
- **Pressed state**: `box-shadow: inset 5px 5px 10px var(--cosmic-shadow-dark), inset -5px -5px 10px var(--cosmic-shadow-light)`

## Example Component

```tsx
export function CosmicButton() {
  return (
    <button className="
      px-6 py-3 
      rounded-2xl
      bg-gradient-to-br from-cosmic-surface to-cosmic-surfaceDark
      text-cosmic-lavender
      border border-cosmic-accent/20
      shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]
      hover:shadow-[inset_5px_5px_10px_var(--cosmic-shadow-dark),inset_-5px_-5px_10px_var(--cosmic-shadow-light)]
      hover:text-cosmic-glow
      transition-all duration-300
    ">
      Cosmic Button
    </button>
  );
}
```

## Color Mixing with Tailwind

Use modern CSS `color-mix()` for transparency:
```css
color-mix(in srgb, var(--cosmic-accent) 20%, transparent)
```

Or use Tailwind's opacity modifiers:
```jsx
<div className="bg-cosmic-accent/20">20% opacity</div>
<div className="text-cosmic-glow/80">80% opacity</div>
```
