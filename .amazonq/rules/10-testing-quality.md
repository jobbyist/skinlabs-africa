# 10 — Testing & Quality

## Testing Pyramid

```
        E2E (Playwright)
       /              \
    SQL Probes    Integration
   /                        \
Unit Tests (Bun)         Component
```

## Unit Tests

**Runtime**: Bun (`bun test`)

**Location**: `src/lib/__tests__/`

**Run tests**:

```bash
bun test
```

### Test Patterns

```typescript
import { describe, test, expect } from "bun:test";

describe("MyFunction", () => {
  test("should do something", () => {
    const result = myFunction(input);
    expect(result).toEqual(expected);
  });
});
```

### What to Test

**Pure functions** (no side effects):

- Business logic
- Data transformations
- Validators
- Formatters
- Calculators

**Examples**:

- `conflictMatcher.test.ts` — Routine conflict detection
- `journey.test.ts` — Journey stage resolution
- `conversionAction.test.ts` — CTA logic
- `skynnTerminology.test.ts` — Terminology enforcement
- `productReviewJsonLd.test.ts` — Structured data

### Coverage Expectations

- **Pure business logic**: 100%
- **Complex flows**: Key paths covered
- **UI components**: Selective (integration preferred)

## E2E Tests

**Framework**: Playwright (`@playwright/test`)

**Location**: `e2e/`

**Run tests**:

```bash
npm run build
npx playwright test
```

### Configuration

File: `playwright.config.ts`

**Projects** (4 combinations):

- Desktop × Light mode
- Desktop × Dark mode
- Mobile × Light mode
- Mobile × Dark mode

**Base URL**: `http://localhost:4173` (Vite preview)

### Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test("should complete flow", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Start");
    await expect(page).toHaveURL("/result");
  });
});
```

### Mock Data

**Supabase mocks**: `e2e/support/mockSupabase.ts`

- In-memory fake Supabase
- Mutable profile data
- RPC/function call log
- Pre-dismisses ad-block notice

### Current E2E Tests

- `onboarding.e2e.ts` — Onboarding flow (28 passing, 4 skipped)
- `skynn.e2e.ts` — SKYNN AI flow

**Skipped tests**: Require `PAYFAST_SANDBOX_E2E` env var.

## SQL Probes

**Database-level tests** (rolled back)

**Location**: `supabase/tests/`

**Run probes**:

```bash
npm run test:sql
# Or: bash scripts/run-sql-probes.sh
```

**Requires**: `SUPABASE_DB_URL` environment variable

### Probe Pattern

```sql
-- supabase/tests/my_feature.sql
BEGIN;

-- Setup
INSERT INTO test_data ...;

-- Test
SELECT assert_equal(
  (SELECT my_function()),
  'expected_value',
  'Function should return expected'
);

-- Cleanup (automatic via ROLLBACK)
ROLLBACK;
```

### Current SQL Probes

- `formulator_allowance.sql` — Basic Analysis limits (19 assertions)
- `advanced_pass_gate.sql` — Analysis Pass consumption (22 assertions)
- `start_free_trial.sql` — Trial flow (13 assertions)

**All passing live** on production.

## Quality Gates

### Pre-Commit Checks

**Lint**:

```bash
npm run lint
# Runs: eslint . && npm run search-index:check
```

**TypeCheck**:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

**Note**: Use `tsconfig.app.json` (not `tsconfig.json` - that's a no-op)

### Pre-PR Checks

**Must pass**:

1. Lint (`npm run lint`)
2. TypeCheck (`npx tsc -p tsconfig.app.json --noEmit`)
3. Unit tests (`bun test`)
4. Production build (`npm run build`)
5. Diff review (no unintended changes)

### CI Pipeline

File: `.github/workflows/ci.yml`

**Jobs**:

1. **checks**:
   - TanStack build (generates route tree)
   - TypeScript compilation
   - Lint
   - Unit tests

2. **e2e**:
   - Playwright tests (Chromium only)
   - Runs on production build

3. **sql-probes**:
   - SQL tests (requires `SUPABASE_DB_URL` secret)
   - Skips if secret not set

## Build Validation

### Production Build

```bash
npm run build
```

**Steps**:

1. Generate sitemap
2. Generate podcast RSS
3. Check search index
4. Compress images
5. Vite build (SPA)
6. Prerender static pages
7. TanStack Start build (SSR)
8. Assemble Vercel output

**All steps are non-blocking** (|| echo message).

### Build Artifacts

- `dist/` — SPA build
- `.output/` — Nitro SSR build
- `.vercel/output/` — Assembled Vercel config

## Manual Testing Checklist

### Critical Flows

1. **Anonymous → Sign Up → Trial**:
   - Complete SKYNN AI
   - Sign up
   - Save results
   - Start trial

2. **Member → Analysis → Results**:
   - Complete analysis
   - View results
   - Download PDF

3. **Trial → Subscribe**:
   - Start trial
   - Add payment method
   - Subscribe

4. **Payment Flow**:
   - Select plan
   - PayFast/PayPal checkout
   - Verify subscription active

### Verification Points

- [ ] No console errors
- [ ] No 404s (Network tab)
- [ ] Layout not broken
- [ ] Images load
- [ ] Forms submit
- [ ] Payments process
- [ ] Emails sent
- [ ] Database updated

## Known Test Gaps

1. **PayFast sandbox**: Not fully exercised (needs merchant credentials)
2. **PayPal live**: Never tested with real payment
3. **Email delivery**: Confirmed via Resend API, not actual inbox
4. **Advanced AI pipeline**: Never run with working key (always 403)
5. **Product review backfill**: Incomplete (quota/key issues)

