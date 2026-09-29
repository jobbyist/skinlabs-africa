# 02 — Claude Code Alignment

## Critical: Working Alongside Claude Code

This repository is actively maintained by **both** Claude Code and Amazon Q Developer. This file defines how Amazon Q should work alongside the existing Claude Code workflow.

## Primary Source of Truth

**CLAUDE.md** is the authoritative project memory document. It contains:

- Complete production architecture history
- All major system changes and migrations
- Standing rules and constraints
- Known issues and gaps
- Deployment procedures
- Infrastructure notes

**Before making significant changes**, always inspect:

1. `CLAUDE.md` (primary source)
2. `.amazonq/rules/` (this directory)
3. `package.json` (current dependencies)
4. Current application architecture
5. Affected database migrations
6. Affected components/routes/API/Edge Functions
7. Relevant Git history

## Source-of-Truth Hierarchy

When sources conflict, follow this precedence:

1. **Explicit task / developer instruction** (highest priority)
2. **Production security & data-integrity requirements**
3. **Current production codebase**
4. **Latest authoritative CLAUDE.md instructions**
5. **.amazonq/rules/** (this directory)
6. **General framework conventions** (lowest priority)

If inconsistencies are found:

- Identify the inconsistency clearly
- Inspect the current implementation
- Avoid speculative architectural changes
- Preserve the working production implementation
- Flag the discrepancy for human review

**Do NOT automatically rewrite the application** simply because a rule appears outdated.

## Preserve Claude Code Production Decisions

### Do NOT:

- Revert production migrations
- Replace established frameworks without authorization
- Replace existing architecture patterns
- Remove production integrations
- Downgrade dependencies without justification
- Recreate deprecated implementations
- Introduce competing abstractions for existing systems
- Modify established security controls merely to simplify development
- "Fix" the repository by reverting to older implementations

### DO:

- Continue using the current architecture
- Respect completed migrations
- Build on existing patterns
- Extend (don't replace) production systems
- Ask before major architectural changes

## Respect Existing Migrations

If Claude Code has migrated a system from one architecture to another, **continue using the new architecture**.

Examples of completed migrations (DO NOT REVERT):

- **Paystack → PayFast + PayPal** (2026-09-18): Payment gateway migration complete
- **Free-first SKYNN AI** (2026-09-24): Anonymous flow, rolling 7-day analysis
- **TanStack Start SSR**: Routes for /briefings, /reviews, /ingredients, /spotlight
- **Advanced Assessment v2.0** (2026-09-23): Dermatologist-approved framework
- **Onboarding overhaul**: Trial system, pending intent, journey model
- **Email automation**: Outbox pipeline with Resend

## Keep Agent Instructions Synchronized

When making production architectural changes:

1. Update the relevant `.amazonq/rules/` file if needed
2. Note the change for CLAUDE.md synchronization
3. Don't allow stale agent instructions to accumulate

If a production change makes an Amazon Q rule inaccurate, **update the rule** as part of the same engineering task when appropriate.

## Framework and Technology Decisions

### CURRENT Production Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build System**: Vite 7
- **Routing**: React Router 6 (SPA) + TanStack Router/Start (SSR routes)
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **Auth**: Supabase Auth
- **Payments**: PayFast (ZAR recurring) + PayPal (USD recurring)
- **Email**: Resend via outbox pipeline
- **AI**: Anthropic Claude (via AI Gateway) + Google Gemini
- **Deployment**: Vercel (with Nitro SSR)
- **Script Runtime**: Bun

### DEPRECATED (Do Not Reintroduce)

- **Paystack**: Removed 2026-09-18, replaced by PayFast + PayPal
- **Magic link sign-in**: Disabled (SMTP issues), keep redirect code
- **SKYNN AI v1 (legacy live-AI)**: Retired 2026-09-28, stub deployed
- **Hardcoded trial copy**: Use `src/lib/promo.ts` helpers
- **Vercel Cron**: Migrated to Supabase Edge Functions + pg_cron

## Database Changes Are Full-Stack Changes

When modifying database schema:

```
Database Schema
    ↓
RLS Policies
    ↓
Edge Functions / RPCs
    ↓
API Routes
    ↓
Frontend Application
    ↓
Authentication Flow
    ↓
Membership Permissions
```

Always:

- Use migrations for schema changes
- Preserve RLS policies
- Update affected Edge Functions/RPCs
- Test authenticated and unauthenticated access
- Consider membership permissions
- Review dependent API routes
- Never perform destructive operations without authorization

## Git and Pull Request Discipline

Amazon Q should:

- Work from the requested branch
- Keep commits focused
- Avoid unrelated modifications
- Produce reviewable diffs
- Reference the originating issue
- Explain architectural implications
- Identify migrations required
- Identify security-sensitive changes
- Identify required environment variables
- Identify deployment considerations

Before opening a PR, ensure:

- `npm run lint` passes
- `npx tsc -p tsconfig.app.json --noEmit` passes
- `bun test` passes (if applicable)
- `npm run build` succeeds
- The diff has been reviewed for unintended changes
