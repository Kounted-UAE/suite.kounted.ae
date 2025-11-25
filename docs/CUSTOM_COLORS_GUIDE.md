# Kounted Custom Colors Guide

## Overview

This project uses custom Kounted brand colors that are configured throughout the application. This guide explains how to properly use these colors in your components.

## Color Palette

The Kounted brand colors are defined in `/lib/config/colors.ts`:

```typescript
export const KountedColors = {
  green: '#80C041',      // Primary brand green
  charcoal: '#0B4624',   // Dark brand color
  dark: '#094213',       // Darker variant
  light: '#F6F9F3',      // Light background color
}
```

## Usage in Tailwind CSS

### Available Utility Classes

The custom colors are available as Tailwind utility classes with the prefix `kounted-`:

#### Background Colors
- `bg-kounted-green` - Primary brand green background
- `bg-kounted-charcoal` - Charcoal background
- `bg-kounted-dark` - Dark background
- `bg-kounted-light` - Light background

#### Text Colors
- `text-kounted-green`
- `text-kounted-charcoal`
- `text-kounted-dark`
- `text-kounted-light`

#### Border Colors
- `border-kounted-green`
- `border-kounted-charcoal`
- `border-kounted-dark`
- `border-kounted-light`

#### Opacity Variants
All colors support opacity modifiers:
- `bg-kounted-green/90` - 90% opacity
- `text-kounted-green/50` - 50% opacity
- `border-kounted-green/75` - 75% opacity

#### State Variants
Common state variants are supported:
- `hover:bg-kounted-green`
- `hover:text-kounted-green`
- `focus:border-kounted-green`
- `ring-kounted-green`

### Example Usage

```tsx
// Button with Kounted green background
<button className="bg-kounted-green text-white hover:bg-kounted-green/90">
  Click Me
</button>

// Text with Kounted green color
<h1 className="text-kounted-green font-bold">
  Welcome to Kounted
</h1>

// Card with light background and green border
<div className="bg-kounted-light border-2 border-kounted-green rounded-lg p-4">
  Content here
</div>
```

## Usage in React Components (TypeScript/TSX)

For programmatic color usage in React components (e.g., SVG icons, PDF generation), import from the colors config:

```tsx
import { KountedColors } from '@/lib/config/colors'

// In your component
<svg>
  <path fill={KountedColors.green} />
</svg>
```

## Usage in CSS Variables

The colors are also available as CSS custom properties in `/lib/styles/tailwind.css`:

```css
:root {
  --kounted-green: #80C041;
  --kounted-charcoal: #0B4624;
  --kounted-dark: #094213;
  --kounted-light: #F6F9F3;
}
```

You can use these in custom CSS:

```css
.my-custom-class {
  background-color: var(--kounted-green);
  color: white;
}
```

## Button Component

The Button component (`components/react-ui/button.tsx`) includes a `green` variant:

```tsx
import { Button } from '@/components/react-ui/button'

// Usage
<Button variant="green">
  Kounted Green Button
</Button>
```

## Configuration Files

The custom colors are configured in three main places:

1. **Color Constants** (`/lib/config/colors.ts`)
   - TypeScript constants for programmatic use

2. **CSS Variables** (`/lib/styles/tailwind.css`)
   - CSS custom properties for the color values

3. **Tailwind Config** (`/tailwind.config.ts`)
   - Maps CSS variables to Tailwind utilities
   - Includes safelist for JIT compilation

## Best Practices

1. **Use Tailwind utilities when possible** - Prefer `bg-kounted-green` over inline styles
2. **Use TypeScript constants for programmatic colors** - Import `KountedColors` for SVG, canvas, PDF generation, etc.
3. **Leverage opacity modifiers** - Use `/90`, `/80` etc. instead of defining new color variants
4. **Maintain consistency** - Use the brand colors consistently across the application

## Troubleshooting

### Colors not appearing?

1. **Check if dev server is running** - Restart with `pnpm dev` or `npm run dev`
2. **Clear build cache** - Delete `.next` folder and rebuild
3. **Verify safelist** - Ensure the class is included in the safelist in `tailwind.config.ts`
4. **Check for typos** - The prefix is `kounted-` (not `kounted.` or `kounted_`)

### Need to add a new utility?

If you need a utility that's not in the safelist, add it to `tailwind.config.ts`:

```typescript
safelist: [
  // ... existing entries ...
  'your-new-class-here',
],
```

## Examples in Codebase

See these files for usage examples:
- `/components/react-ui/button.tsx` - Button variants
- `/lib/assets/logos/KountedLogo.tsx` - Logo components using colors
- `/lib/utils/pdf/generatePayslipPDFStyled.ts` - PDF generation with colors

