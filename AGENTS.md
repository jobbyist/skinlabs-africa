
- `tsconfig.app.json` excludes tests and the TanStack SSR routes (`src/router.tsx`, `src/routes/**`): tests need bun/node types and the routes need the gitignored generated route tree, so they are checked by their own builds.
- `src/integrations/supabase/types.ts` must describe the production database the app talks to; if it is regenerated from the wrong database, restore it from git history.
