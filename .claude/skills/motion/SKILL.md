---
name: motion
description: >-
  Apply high-quality, intentional interface motion to SkinLabs® using
  Emil-inspired motion principles. Improve interaction feedback, transitions,
  hierarchy, continuity, and perceived product quality without introducing
  excessive animation, visual noise, new design language, or unnecessary
  dependencies. Preserve the existing SkinLabs® Design System, accessibility,
  performance, responsive behavior, and reduced-motion conventions.
---

# SkinLabs® Motion Skill

## Purpose

A production-grade motion system for SkinLabs®. Use it when improving page and
component transitions; button, hover, focus and press states; cards;
navigation; dialogs, sheets, dropdowns and menus; forms; loading and skeleton
states; AI / SKYNN AI interactions and result reveals; empty, success and error
states; progressive disclosure; scroll-triggered content; micro-interactions;
animated brand accents.

The objective is not to "add animations". It is to make the interface feel
intentional, responsive, coherent, premium, calm, alive, understandable, fast
and tactile. Motion should communicate what changed, why, and where attention
should go.

## Where things live (read before editing)

- `src/index.css` — `.gradient-border-anim` (+ `gradient-border-spin`
  keyframes), `.gradient-text`, `.gradient-bg-soft`, `--gradient-brand`, the
  `--shadow-*` scale, and the single global
  `@media (prefers-reduced-motion: reduce)` block. Add reduced-motion rules
  there, not per component.
- `tailwind.config.ts` — accordion keyframes; `tailwindcss-animate` supplies
  `animate-in/out`, `fade-*`, `zoom-*`, `slide-*` used by the Radix primitives.
- `src/components/ui/button.tsx` — the shared press (`active:scale-[0.98]`)
  and 150ms ease-out transition for every Button (the `link` variant opts out
  with `active:scale-100`). Don't re-add these per call site.
- `src/components/ui/{dialog,sheet,popover,dropdown-menu,tooltip}.tsx` —
  Radix entrance/exit. Sheet: 300ms ease-out in / 200ms ease-in out.
- `src/components/FloatingBottomNav.tsx` — `NAV_ITEM` holds the tab
  press/focus treatment.
- `framer-motion` is already installed and used in some components. Reuse it
  only where CSS genuinely can't do the job; never add another motion library.

## 1. Core principle

Every animation must have a reason: feedback, continuity, hierarchy,
orientation, state communication, spatial relationships, attention guidance,
perceived responsiveness, or brand expression. Otherwise don't add it. Prefer
no animation over unnecessary animation.

## 2. Philosophy

SkinLabs® is editorial, modern, premium and information-first. Motion is
refined not flashy, precise not playful, restrained, fast, tactile, intelligent.
Avoid: excessive bounce/spring, giant scale changes, parallax, floating blobs,
constant background movement, glassmorphism excess, neon, animation
everywhere, repeated attention grabs, dramatic page transitions, decorative
motion with no function. Support the existing visual language; never create a
new one.

## 3. Existing conventions (preserve)

- animated brand-gradient borders (`.gradient-border-anim`)
- button hover ≈ `scale(1.02)`–`scale(1.05)`; active ≈ `scale(0.98)`
- card hover ≈ `-translate-y-0.5` + a small shadow increase
- Radix dialog/sheet entrance and exit animations
- reduced-motion fallbacks in `src/index.css`

## 4. Motion hierarchy

1. **Micro** — hover, press, icon, checkbox/toggle, focus, tooltip, nav
   selection. Fast, subtle, transform/opacity.
2. **Component** — cards appearing, dropdowns, dialogs, sheets, accordions,
   tabs. Slightly longer.
3. **Page** — initial reveal, major route transition, dashboard section
   entrance. Sparingly; a few coordinated transitions, never every element.
4. **Brand** — SKYNN AI, AI processing, gradient borders, major product and
   onboarding moments. Controlled.

## 5. Properties

Prefer `transform`, `opacity`. Acceptable: `box-shadow`, `filter`,
`background-color`, `border-color`, `color`. Avoid animating `width`,
`height`, `top`, `left`, `margin`, `padding` when a transform works. For
expand/collapse, use the existing primitives (Radix accordion/collapsible).

## 6. Timing

- Micro: ~100–180ms
- Component: ~160–280ms
- Larger: ~250–450ms, only when the distance requires it

The interface must never feel like it's waiting for an animation.

## 7. Easing

Entrances `ease-out`, exits `ease-in`, state changes `ease`. `linear` only for
continuous motion (spinners, looping gradients, progress). No exaggerated
elastic/bounce unless the interaction genuinely benefits.

## 8–11. Hover, press, cards, buttons

- Hover: one or two subtle signals (`-translate-y-px`, `scale(1.02)`, shadow).
  Never scale + rotate + translate + blur + glow on ordinary buttons.
- Press: `scale(0.98)`, very short, never enough to shift layout.
- Cards: interactive cards get a tiny lift + stronger shadow; no rotation,
  bounce, big scale or floating. Informational cards stay static.
- Buttons: rest → hover → active (+ focus, loading, success, disabled). Keep
  the existing architecture; outline buttons with `.gradient-border-anim`
  keep that mechanism rather than a second gradient animation.

## 12. Icons

Move only to communicate state: chevron rotating on open, arrow nudge on CTA
hover, menu ↔ close, refresh rotating while refreshing, check on success. No
decorative spinning, bouncing or pulsing.

## 13. Navigation

Active indicators, underline movement, opacity changes, mobile selection,
menu open/close. Never animate whole nav layouts. The fixed mobile bottom nav
prioritises immediate feedback; nav should feel faster than content.

## 14. Dialogs, sheets, menus

Preserve spatial context: dialogs from their context, sheets from their edge,
dropdowns near the trigger. `opacity + small translate`, not `scale(0) →
scale(1)`. Preserve existing shadcn/Radix behaviour.

## 15–17. Page entrance, stagger, scroll

- No intro animations on ordinary page loads. Primary content first, secondary
  follows naturally (headline → description → CTA → supporting).
- Stagger short (0/60/120/180ms), never 400ms+ steps. With many elements,
  animate fewer of them instead of lengthening the stagger.
- Scroll-triggered motion only for major sections/editorial storytelling;
  never every paragraph or card, no repeated re-triggers, content must be
  usable if the animation fails.

## 18. AI and SKYNN AI

May be more expressive, but must reflect a real state: idle, thinking,
processing, streaming, complete, warning, error. Processing → subtle opacity
pulse, gradient movement, progress, controlled shimmer. Streaming → only
where it signals new content. Completion → restrained. No fake "AI magic",
excessive glow, constant pulsing, fast gradients, or motion implying
intelligence where no state exists.

## 19. Brand gradient

`#22c55e → #3b82f6 → #a855f7 → #ec4899` is the flagship AI accent. Animate it
selectively (SKYNN AI signature, `.gradient-border-anim`, AI processing,
important AI CTAs). Never whole backgrounds, every heading/button/card, or
constant gradients everywhere. One strong gradient moment beats many weak ones
(CLAUDE.md: max one gradient accent per screen).

## 20–23. Loading, skeletons, success/error, forms

- Loading: skeletons, subtle opacity, progress, restrained spinners. Never
  more interesting than the content; skip it for fast loads.
- Skeletons are quiet: "content is coming", not "look at this".
- Success/error: clear state change, no confetti, big bouncing checks or
  aggressive shaking.
- Forms: focus, validation, errors near the field, conditional fields.
  Localised transitions; never move the whole form.

## 24. Accessibility

Every implementation respects `prefers-reduced-motion: reduce`: drop decorative
animation, shorten transitions, remove large transforms, stop loops where
possible, keep essential state changes and hierarchy, never hide content
because animation is off. Motion is optional; information is not. The global
block in `src/index.css` already collapses transitions, Radix animate-in/out,
accordions, skeleton pulse and the gradient border spin. Spinners are kept
on purpose because they communicate state.

## 25–26. Performance and JS animation

No expensive JS loops, unnecessary libraries, heavy DOM work, continuous
animation across large sections, large blurs/filters, or repeated layout
thrash. Prefer CSS transitions/keyframes on transform/opacity and existing
primitives. Use JS only when CSS can't do it: isolate it, clean up listeners,
avoid re-renders, pause off-screen, respect reduced motion, and keep it out of
business logic.

## 27–29. Guardrails

- The SkinLabs® Design System is authoritative: inspect the component, its
  classes, existing utilities, tokens and related components first, and reuse.
- Don't change typography, colours, spacing, component styling, radius
  system, shadow system, or add unrelated gradients/glass/neon/frameworks.
- Don't touch auth, Supabase queries, schemas, payments, membership,
  subscriptions, entitlements, AI prompts/models, API contracts, SEO,
  analytics, routing or security rules. If a motion change needs
  architectural changes, stop and report instead of refactoring.

## 30–32. Audit and intensity

Before editing, determine what animates now, existing states and transition
classes, primitives, a11y, responsive and dark-mode behaviour. Then make the
smallest set of changes that materially helps. Don't rewrite components.

Per component, ask about: purpose, timing, easing, distance, continuity,
hierarchy, frequency, accessibility, performance, consistency.

Intensity: 0 Static (content, metadata, non-interactive cards) · 1 Micro
(hover/focus/active/icons) · 2 Component (menus, dialogs, cards, tabs) ·
3 Expressive (onboarding, AI states, major moments) · 4 Dramatic (rare, strong
reason) · 5 Spectacle (never in product UI). Challenge anything at 4–5.

## 33. Procedure when /motion is invoked

1. **Inspect** the target, related components, tokens, animation utilities,
   routes and CSS.
2. **Audit** for missing feedback, inconsistent transitions, excess motion,
   awkward timing, a11y and performance problems.
3. **Plan** each change: element, purpose, trigger, motion, duration,
   easing, reduced-motion behaviour.
4. **Implement** only meaningful improvements.
5. **Verify** desktop, mobile, dark mode, keyboard, reduced motion, loading,
   error, hover, active, focus, disabled.
6. **Clean up** duplicate/conflicting transitions, unused classes,
   unnecessary JS and dependencies.

## 34. Priority order

1. Broken/missing interaction feedback 2. Accessibility 3. Awkward/slow
transitions 4. Inconsistent behaviour 5. Navigation continuity 6. State
communication 7. Component polish 8. AI/brand motion 9. Decorative motion.

## 35. Verification

Check `package.json` first and don't invent commands. This repo has
`npm run lint`, `bun test` (`npm run test`) and `npm run build`; there is no
`typecheck` script, so use `npx tsc --noEmit -p tsconfig.app.json` (the root
`tsconfig.json` is a no-op). For a quick build check, `npx vite build` is
enough. The full `npm run build` also prerenders and runs the SSR build.
Verify the UI in the running app when possible.

## 36. Final QA checklist

- [ ] Every animation has a purpose and matches SkinLabs®
- [ ] No unnecessary animation; hovers subtle; presses tactile
- [ ] Focus states accessible; nav feedback immediate
- [ ] Dialogs/sheets keep spatial context; cards don't over-animate
- [ ] AI motion reflects real states; brand gradient restrained
- [ ] Loading quiet; success/error useful
- [ ] Mobile and dark mode correct; `prefers-reduced-motion` respected
- [ ] No new dependency, business logic, or unnecessary token changes
- [ ] lint / typecheck / tests / build healthy

## 37. Definition of done

The interface feels more responsive, states are easier to understand, key
transitions feel intentional, motion supports hierarchy without distracting,
the visual language is intact, reduced-motion users get equivalent
functionality, performance holds, no unrelated architecture changed, and the
implementation is simple enough for another engineer to understand
immediately. The goal isn't more animation. It's a SkinLabs® that feels more
intentional.
