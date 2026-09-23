---
name: polish
description: >
  Perform a production-grade final UI/UX polish pass on a SkinLabs® page,
  component, flow, or frontend surface. Improve visual hierarchy, spacing,
  typography, interaction states, responsiveness, accessibility, motion,
  dark mode, and overall product craft while strictly preserving the
  existing SkinLabs Design System, information architecture, functionality,
  and established visual language.
---

# SkinLabs® — `/polish`

You are performing a final production UI/UX polish pass on the SkinLabs®
frontend.

Your objective is NOT to redesign the product.

Your objective is to make the existing implementation feel more deliberate,
cohesive, premium, responsive, accessible, and production-ready.

Think:

> "Same product. Better execution."

Never replace an established SkinLabs pattern merely because another pattern
looks more fashionable.

---

# 1. NON-NEGOTIABLE PRINCIPLES

Before changing anything:

1. Inspect the existing implementation.
2. Identify the page's purpose and primary user action.
3. Inspect surrounding components for established patterns.
4. Read the relevant SkinLabs design-system implementation.
5. Reuse existing components, tokens, utilities, and patterns wherever possible.
6. Preserve existing information architecture.
7. Preserve existing business logic.
8. Preserve existing routing.
9. Preserve existing authentication and entitlement behavior.
10. Preserve existing accessibility behavior unless it is being improved.
11. Do not introduce a second design language.
12. Do not perform speculative refactors.
13. Do not change copy unless it is necessary to fix an obvious UI problem.
14. Do not introduce new dependencies unless absolutely necessary.
15. Do not replace working components with a new component library.
16. Do not modify backend/API/database behavior as part of a visual polish pass.

The SkinLabs codebase is the source of truth.

The design-system document is a reference snapshot. If implementation and
documentation disagree, inspect the implementation and follow the existing
source-of-truth code unless the user explicitly requests a design-system
change.

---

# 2. FIRST: UNDERSTAND THE SURFACE

Before editing, determine:

- What page/component is being polished?
- Is it public, authenticated, or admin?
- What is the primary CTA?
- What is the secondary action?
- What information is most important?
- What should the user notice first?
- What should the user do next?
- Which components are shared?
- Which states exist?
- Does the surface support light and dark mode?
- Is the surface responsive?
- Does it contain animation?
- Does it contain forms?
- Does it contain AI-generated information?
- Does it contain membership/entitlement-gated content?

Do not start by changing CSS.

First understand the hierarchy.

---

# 3. SKINLABS VISUAL LANGUAGE

SkinLabs uses a deliberately restrained visual system.

The base visual language is:

- monochrome
- editorial
- modern
- clean
- technical
- premium
- approachable
- information-first

Color should be used deliberately.

The SkinLabs brand gradient is an accent system, not a replacement for the
monochrome interface.

Do not turn an entire page into a gradient-heavy composition.

Avoid:

- generic SaaS aesthetics
- excessive glassmorphism
- excessive neon
- excessive gradient backgrounds
- excessive floating blobs
- excessive rounded containers
- excessive shadows
- excessive cards
- ornamental UI with no functional purpose
- generic "AI dashboard" styling
- visual noise

The result should feel like SkinLabs, not a template.

---

# 4. TYPOGRAPHY

SkinLabs typography:

Heading:
- Montserrat
- Tailwind: `font-heading`

Body/UI:
- Inter
- Tailwind: `font-sans`

Serif:
- Lora
- Tailwind: `font-serif`
- Use sparingly.

Mono:
- Space Mono
- Tailwind: `font-mono`
- Primarily for technical/code-like labels and keyboard hints.

Headings use slightly negative tracking through the existing base styles.

Preserve the established type hierarchy.

When polishing typography:

- Improve hierarchy before changing font sizes.
- Prefer weight and spacing adjustments over dramatic size changes.
- Avoid excessive uppercase text.
- Avoid excessive letter spacing.
- Avoid arbitrary font sizes when an existing Tailwind scale works.
- Preserve readable body copy.
- Ensure headings wrap gracefully on mobile.
- Prevent important CTA text from wrapping awkwardly.
- Do not introduce another font.

Never load another font.

Never replace Montserrat or Inter with a trendy alternative.

---

# 5. COLOR SYSTEM

SkinLabs uses HSL CSS custom properties defined in:

`src/index.css`

Consume the existing design tokens through Tailwind.

Prefer:

- `bg-background`
- `text-foreground`
- `bg-card`
- `text-muted-foreground`
- `border-border`
- `bg-primary`
- `text-primary-foreground`
- existing semantic tokens

Do NOT introduce arbitrary colors if an appropriate design token exists.

Do NOT hard-code hex values inside components unless the existing system
specifically requires it.

The primary SkinLabs gradient is:

`#22c55e → #3b82f6 → #a855f7 → #ec4899`

Use the existing utilities:

- `.gradient-text`
- `.gradient-border-anim`
- `.gradient-bg-soft`

Do not recreate the gradient manually.

The gradient should normally represent a single visual focal point rather
than becoming the page's dominant color system.

---

# 6. BRAND GRADIENT RULE

The brand gradient is a flagship accent.

Use it strategically.

Good uses:

- SKYNN AI
- important AI moments
- confidence indicators
- selected/highlighted states
- premium feature moments
- CTA borders where the established pattern already exists

Bad uses:

- every heading
- every button
- every card
- entire page backgrounds
- body text
- decorative elements with no purpose

If the page already has a strong gradient focal point, do not add another one
unless it improves hierarchy.

Prefer one strong gradient moment over five weak ones.

---

# 7. LOGO & BRANDING

Do not recreate or redraw the SkinLabs logo.

Use the existing asset:

`src/assets/newskinlabs.png`

Preserve the distinction between:

`SkinLabs®`

`SkinLabs`

`SKYNN AI`

The `®` and BETA treatment are live markup and should remain live markup.

Do not flatten the BETA badge or registered trademark into a new image.

Do not create alternate logo treatments.

For SKYNN AI, preserve the existing flagship treatment:

- white pill
- black text
- Sparkles icon
- animated SkinLabs gradient border

Do not invent another SKYNN AI visual identity.

---

# 8. SPACING & LAYOUT

Prioritize rhythm and alignment.

Check:

- page margins
- container width
- section spacing
- card padding
- text-to-action spacing
- vertical rhythm
- alignment between related components
- mobile gutters
- CTA proximity
- whitespace around major headings

SkinLabs uses:

- max-width around 1400px at the `2xl` breakpoint
- approximately 2rem side padding
- centered content
- 64px mobile header
- 80px desktop header

Do not arbitrarily widen content.

Do not create excessively narrow reading columns unless the content requires
it.

Do not stack everything inside cards.

Whitespace is a design element.

When something feels cluttered, first consider:

- removing unnecessary borders
- increasing spacing
- improving hierarchy
- reducing redundant labels
- simplifying grouping

before adding another container.

---

# 9. BORDER RADIUS

Respect the existing radius hierarchy.

SkinLabs uses:

- `rounded-sm` → small chips
- `rounded-md` → standard buttons
- `rounded-lg` → popovers/dropdowns/selects
- `rounded-xl` → dialogs/alerts
- `rounded-2xl` → cards and mobile command surfaces
- `rounded-full` → pills/badges/avatars

Do not make every element `rounded-2xl`.

Do not make every element pill-shaped.

Radius should communicate component hierarchy.

---

# 10. ELEVATION & SHADOW

SkinLabs uses a two-layer shadow system:

- tight contact shadow
- softer ambient shadow

Prefer the existing Tailwind shadow utilities.

Use elevation sparingly.

A polished interface should not look like every element is floating.

When a component already has a shadow:

- improve its hierarchy first
- avoid simply increasing shadow intensity
- avoid adding multiple competing shadows

Dark mode requires appropriate contrast against dark surfaces.

---

# 11. BUTTONS & CTA POLISH

Inspect every important CTA.

Check:

- visual priority
- label clarity
- size
- alignment
- icon placement
- hover state
- active state
- focus state
- disabled state
- loading state
- mobile width
- text wrapping

Existing SkinLabs rule:

White-background / black-text outline buttons use:

`.gradient-border-anim`

Black-background / white-text primary buttons remain comparatively restrained.

Do not turn every button into a gradient button.

Primary CTA hierarchy should remain obvious.

Use:

- `hover:scale-[1.02–1.05]`
- `active:scale-[0.98]`

only where the existing interaction pattern supports it.

Do not make buttons bounce.

---

# 12. CARDS

Default SkinLabs card language:

- `rounded-2xl`
- border
- `shadow-sm`

Cards should create meaningful grouping.

Before adding a card, ask:

> Does this information actually need a surface?

Avoid:

Card inside card inside card.

If multiple adjacent cards exist:

- align their internal spacing
- standardize heading treatment
- standardize action placement
- standardize padding
- remove unnecessary visual competition

Prefer fewer, stronger surfaces.

---

# 13. MOTION

Motion should communicate:

- interaction
- hierarchy
- state change
- continuity
- feedback

Motion should NOT exist merely because the interface can animate.

Use transform and opacity whenever practical.

Existing SkinLabs conventions include:

- gradient border rotation
- subtle button scale
- subtle card elevation
- dialog/sheet enter/exit
- fade
- zoom
- slide
- scroll progress

Preserve the existing conventions.

For new motion:

1. Define what is changing.
2. Define why it should animate.
3. Define what the user should perceive.
4. Choose the smallest effective movement.
5. Use appropriate easing.
6. Avoid animating large numbers of unrelated elements simultaneously.
7. Ensure the animation does not delay interaction.
8. Respect reduced motion.

Avoid:

- bounce-heavy UI
- excessive spring effects
- infinite decorative motion
- parallax unless explicitly required
- large-scale page movement
- attention-stealing animations
- animations that compete with SKYNN AI's gradient treatment

When animation is not necessary, do not add it.

---

# 14. REDUCED MOTION

All meaningful motion must degrade gracefully under:

`prefers-reduced-motion: reduce`

SkinLabs already provides reduced-motion behavior.

Do not introduce animations that bypass it.

For reduced motion:

- remove unnecessary movement
- reduce transitions to instant/no-op
- preserve state visibility
- preserve usability
- never hide information behind animation

---

# 15. INTERACTION STATES

Every interactive element should have appropriate states.

Check:

- default
- hover
- focus-visible
- active
- disabled
- loading
- success
- error

For keyboard users:

- focus must be visible
- focus must not rely exclusively on color
- focus must not be removed with `outline-none` unless replaced appropriately

For touch devices:

- controls must have practical tap targets
- hover must not be required to understand functionality

Do not create hover-only functionality.

---

# 16. DARK MODE

SkinLabs supports light and dark mode using:

`next-themes`

and:

`darkMode: ["class"]`

The theme is applied to `<html>` using the `dark` class.

When polishing a component, inspect both themes.

Do not assume a light-mode change will automatically work in dark mode.

Check:

- text contrast
- borders
- card surfaces
- shadows
- icons
- inputs
- buttons
- badges
- gradient visibility
- disabled states
- focus states
- dialogs
- dropdowns

Do not introduce one-off dark-mode colors when an existing token works.

The dark interface should feel intentional, not like an inverted light mode.

---

# 17. RESPONSIVE POLISH

Always inspect at minimum:

- mobile
- tablet
- desktop
- wide desktop

Prioritize mobile.

Look for:

- horizontal overflow
- clipped text
- oversized headings
- awkward wrapping
- cramped controls
- excessive vertical spacing
- CTA stacking problems
- card grids collapsing badly
- navigation collisions
- modal overflow
- sticky/fixed UI overlap
- bottom-navigation interference

Do not simply shrink desktop layouts.

Recompose them when necessary.

Mobile should feel intentionally designed.

---

# 18. FORMS

For forms, inspect:

- label hierarchy
- field spacing
- placeholder clarity
- input height
- focus states
- validation
- error messaging
- disabled states
- loading state
- keyboard behavior
- mobile layout

Do not use placeholder text as the only label.

Errors should appear close to the relevant field.

Do not make error states visually aggressive unless the severity requires it.

---

# 19. AI / SKYNN AI SURFACES

SKYNN AI is a flagship product surface.

Protect its visual distinction.

Preserve the established SKYNN AI identity.

When polishing SKYNN AI interfaces:

- keep the gradient purposeful
- avoid making every element gradient-based
- preserve confidence and analysis hierarchy
- distinguish AI-generated content from ordinary UI
- maintain readable report structures
- avoid excessive "AI magic" decoration
- avoid chat-bubble aesthetics unless the product explicitly requires them

For AI reports:

Prioritize:

1. interpretation
2. confidence/clarity
3. recommendations
4. evidence
5. actions
6. secondary detail

Do not make decorative UI more prominent than the actual skincare insight.

---

# 20. MEMBERSHIP & ENTITLEMENT SURFACES

Do not change entitlement logic.

Do not expose gated functionality.

Do not change membership capabilities.

When polishing gated UI:

- make access status clear
- preserve existing upgrade patterns
- distinguish available vs locked features
- avoid manipulative visual treatment
- do not imply a feature exists when it is unavailable

The visual polish must not alter authorization behavior.

---

# 21. CONTENT DENSITY

SkinLabs contains information-heavy surfaces.

Do not automatically reduce content simply to make a page look cleaner.

Instead:

- improve hierarchy
- group related information
- use progressive disclosure
- improve spacing
- use headings
- use muted secondary text
- use appropriate visual anchors

Information should remain accessible.

Avoid turning useful content into tiny text.

---

# 22. ACCESSIBILITY

Before completing the polish pass, inspect:

- semantic HTML
- heading hierarchy
- accessible names
- button labels
- link labels
- keyboard navigation
- focus visibility
- contrast
- form labels
- error messaging
- ARIA usage
- reduced motion
- screen-reader-only content where appropriate

Do not add ARIA attributes unnecessarily.

Prefer native HTML semantics.

Do not sacrifice accessibility for visual aesthetics.

---

# 23. PERFORMANCE

Do not create a visually polished but technically heavier interface.

Avoid:

- unnecessary dependencies
- large animation libraries for simple transitions
- oversized images
- unnecessary client-side JavaScript
- unnecessary re-renders
- expensive scroll handlers
- continuous animation where static UI works
- duplicated CSS

Prefer existing utilities and components.

For animation, prefer CSS where sufficient.

Do not introduce JavaScript animation merely to animate opacity or transforms.

---

# 24. SEO & SEMANTIC STRUCTURE

When polishing public pages:

Do not accidentally damage:

- semantic headings
- metadata
- structured data
- canonical URLs
- internal links
- accessible link text
- crawlable content
- prerendered content

Do not convert meaningful text into images.

Do not hide important SEO content behind client-only interactions unless the
existing architecture already requires it.

Do not modify SEO behavior during a purely visual polish pass unless fixing
an obvious regression.

---

# 25. DO NOT TOUCH

Unless explicitly requested, do not modify:

- Supabase schema
- database migrations
- RLS policies
- authentication logic
- payment logic
- membership entitlement logic
- AI prompts
- AI safety logic
- API contracts
- environment variables
- secrets
- backend functions
- product business rules
- analytics events
- tracking identifiers
- SEO architecture
- routing architecture
- dependency versions

If you discover a problem in one of these areas, report it rather than
silently changing it.

---

# 26. CHANGE DISCIPLINE

Make the smallest set of changes that produces a meaningful improvement.

Prefer:

existing component + better spacing

over:

new component

Prefer:

existing token + better usage

over:

new token

Prefer:

existing animation + better timing

over:

new animation system

Prefer:

existing card + better hierarchy

over:

new card architecture

Do not rewrite a component simply because it could be cleaner.

---

# 27. POLISH PRIORITY ORDER

Perform the sweep in this order:

## Pass 1 — Hierarchy

Check:

- primary heading
- supporting copy
- primary CTA
- secondary actions
- visual focal point

Fix hierarchy before decoration.

## Pass 2 — Layout

Check:

- container width
- spacing
- alignment
- section rhythm
- responsive composition

## Pass 3 — Typography

Check:

- font family
- weight
- size
- line-height
- tracking
- wrapping

## Pass 4 — Components

Check:

- buttons
- cards
- badges
- inputs
- dialogs
- navigation
- icons

## Pass 5 — Surfaces

Check:

- borders
- radius
- shadows
- background contrast

## Pass 6 — Interaction

Check:

- hover
- focus
- active
- disabled
- loading
- error
- success

## Pass 7 — Motion

Check:

- transitions
- entrance/exit
- hover movement
- loading states
- unnecessary animation
- reduced motion

## Pass 8 — Responsive

Check:

- mobile
- tablet
- desktop
- wide desktop

## Pass 9 — Accessibility

Check:

- semantics
- keyboard
- contrast
- focus
- labels
- motion

## Pass 10 — Final coherence

Ask:

> Does this look unmistakably like SkinLabs?

If not, identify why before making further changes.

---

# 28. VISUAL QA CHECKLIST

Before finishing, verify:

### Brand
- [ ] Correct SkinLabs logo
- [ ] Correct SkinLabs® naming
- [ ] Correct SKYNN AI naming
- [ ] No invented brand treatment

### Typography
- [ ] Montserrat headings
- [ ] Inter body/UI
- [ ] Correct hierarchy
- [ ] No awkward wrapping
- [ ] No unnecessary uppercase

### Color
- [ ] Existing semantic tokens used
- [ ] Monochrome foundation preserved
- [ ] Gradient used deliberately
- [ ] No arbitrary colors

### Layout
- [ ] Consistent spacing
- [ ] Correct container width
- [ ] Good visual rhythm
- [ ] No unnecessary nesting

### Components
- [ ] Existing component patterns preserved
- [ ] Buttons have clear hierarchy
- [ ] Cards are purposeful
- [ ] Radius hierarchy is consistent

### Motion
- [ ] Motion has a purpose
- [ ] No excessive animation
- [ ] Transform/opacity preferred
- [ ] Reduced-motion behavior works

### Responsive
- [ ] Mobile reviewed
- [ ] Tablet reviewed
- [ ] Desktop reviewed
- [ ] No overflow
- [ ] Fixed navigation does not obscure content

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus-visible states exist
- [ ] Labels are accessible
- [ ] Contrast is sufficient
- [ ] Reduced motion is respected

### Dark mode
- [ ] Light mode checked
- [ ] Dark mode checked
- [ ] No unreadable text
- [ ] Borders remain visible
- [ ] Controls remain distinguishable

### Engineering
- [ ] No unnecessary dependencies
- [ ] No backend changes
- [ ] No business-logic changes
- [ ] No secrets changed
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Relevant tests pass

---

# 29. VERIFICATION COMMANDS

After editing, run the project's existing validation commands.

Prefer the repository's package-manager scripts.

Typical checks:

```bash
npm run lint
npx tsc --noEmit
```
