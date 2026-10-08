
- `tsconfig.app.json` excludes tests and the TanStack SSR routes (`src/router.tsx`, `src/routes/**`): tests need bun/node types and the routes need the gitignored generated route tree, so they are checked by their own builds.
- Floating bottom navigation derives one active tab from the shared navigation matcher and uses fixed-size targets with CSS icon states rather than a measured background indicator, preventing coordinate drift and layout shifts.
- `src/integrations/supabase/types.ts` must describe the production database the app talks to; if it is regenerated from the wrong database, restore it from git history.
