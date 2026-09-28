# 04 — UI/UX Design System

## Preserve Established Design System

**Do NOT**:

- Redesign unrelated interfaces while implementing functionality
- Replace established components with generic UI libraries without authorization
- Change the design system to match generic patterns
- Remove gradient accents or brand elements

## Brand Identity

**SkinLabs®** — South African skincare intelligence platform

- Logo: `src/assets/skinlabs-logo-black.svg` (light mode)
- Logo: `src/assets/skinlabs-logo-white.svg` (dark mode)
- Wordmark: `src/assets/skinlabs-wordmark.png`

## Color System

### Brand Colors (CSS Variables)

```css
--brand-slate: #64748b;
--brand-cream: #faf9f6;
--brand-ink: #262626;
--brand-canvas: #ffffff;
--brand-gold: #f59e0b;
--secondary-text: #6b7280;
```

### Gradient

```css
--gradient-brand: linear-gradient(135deg, 
  #22c55e 0%,   /* emerald */
  #3b82f6 33%,  /* blue */
  #a855f7 66%,  /* purple */
  #ec4899 100%  /* pink */
);
```

**Usage**:

- `.gradient-text` — one accent phrase per view
- `.gradient-border-anim` — animated ring (buttons, cards)
- `.gradient-bg-soft` — subtle background tint

**Sparingly**: One gradient moment per screen, not default text color.

## Typography

- **Headings**: Default `-0.015em` letter-spacing
- **Body**: Default line-height
- **Font**: System font stack (Tailwind default)

## Spacing & Layout

- Use Tailwind spacing scale (4px base unit)
- Prefer established patterns over arbitrary values
- Responsive: Mobile-first approach

## Shadows

Two-layer contact + ambient stack:

```css
--shadow: /* contact + ambient */
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

## Border Radius

- **Cards**: `rounded-2xl` (default)
- **Dialogs**: `sm:rounded-xl`
- **Buttons**: Default (CVA variants)
- **Badges**: `rounded-full`

## Component Library

### shadcn/ui Primitives

**Located**: `src/components/ui/`

**Do NOT edit directly** (regenerated from shadcn):

- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- etc.

**Extend with variants**:

```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

<Button 
  variant="outline"
  className={cn("gradient-border-anim", props.className)}
>
  Click me
</Button>
```

### Feature Components

**Compose from primitives**:

- Use existing components first
- Match established patterns
- Maintain visual consistency

## Animations & Motion

**Principles**: `.claude/skills/motion/SKILL.md`

### Transitions

- **Buttons**: 150ms ease-out (color, shadow, transform)
- **Sheets**: 300ms ease-out entrance, 200ms ease-in exit
- **Cards**: 200ms ease-out lift + shadow
- **Tabs**: Smooth position transitions

### Motion Utilities

- `.card-interactive` — 2px lift + shadow on hover
- `animate-in` / `fade-in` — Tailwind Animate
- `framer-motion` — Complex animations only

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

Also check in JS: `framer-motion` animations use `useReducedMotion()`.

## Dark Mode

**System**: `next-themes` with `class` strategy

- Detects OS preference automatically
- Toggle: `ThemeToggle.tsx` (Sun/Moon button)
- Persists choice in localStorage

### Theme Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  /* ... */
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

## Accessibility

- Use semantic HTML
- Include ARIA labels where needed
- Keyboard navigation supported
- Focus visible styles
- Color contrast meets AA

## Responsive Breakpoints

Tailwind defaults:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Mobile-first: Base styles are mobile, use `sm:` and up for larger screens.

## Z-Index Scale

```
Fixed bars: ≤ z-[60]
Modals: z-[65] (Dialog, Sheet, AlertDialog)
Floating layers: z-[70] (Popover, Select, Dropdown)
Search: z-[75]
Story viewer: z-[80]
Toasts/Preloader: z-[100]
```

**Keep overlay and panel on same tier**.

## Forms

- Use `react-hook-form` + Zod
- Inline errors via `role="alert"`
- Disabled state during submission
- Clear success/error feedback

## Loading States

- Skeleton loaders (shimmer)
- Spinners (operation in progress)
- Disabled buttons (submitting)
- Never leave users guessing

## Empty States

- Friendly message
- Actionable CTA
- Optional illustration
- Example: "No analyses yet. Start your first one!"

## Known Patterns

- **Gradient accents**: One per screen (SKYNN AI wordmark, stepper circle)
- **Hero stats**: Hover lift + shadow
- **Card grids**: Consistent spacing, hover transitions
- **Gated content**: Blur + overlay + conversion CTA

