
- `tsconfig.app.json` excludes tests and the TanStack SSR routes (`src/router.tsx`, `src/routes/**`): tests need bun/node types and the routes need the gitignored generated route tree, so they are checked by their own builds.
- Floating bottom navigation derives one active tab from the shared navigation matcher and uses fixed-size targets with CSS icon states rather than a measured background indicator, preventing coordinate drift and layout shifts.
- Protected generated Supabase files must never be modified. App imports resolve through `productionClient.ts` to the existing client with the owner-maintained `supabase/types.baseline.ts` schema; matching TypeScript and Vite aliases keep runtime session behavior unchanged while protecting against stale generated types.
