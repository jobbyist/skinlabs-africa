import { createRouter as createTanStackRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Fallbacks for the server-rendered content routes. Real browsers replace this markup with the SPA (see
// src/routes/__root.tsx), so it is what crawlers and no-JS clients see: plain, generic, no technical detail.
// The cause is logged for developers (Vercel function logs).
// eslint-disable-next-line react-refresh/only-export-components -- router fallbacks, not an HMR module
function DefaultError({ error }: ErrorComponentProps) {
  console.error('[ssr] route failed to load:', error)
  return (
    <main>
      <h1>We couldn't load this page</h1>
      <p>Something went wrong on our side. Please try again in a moment.</p>
      <p>
        <a href="/">Back to SkinLabs</a> · <a href="/briefings">Briefings</a> · <a href="/reviews">Reviews</a>
      </p>
    </main>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function DefaultNotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>This page moved, was unpublished or never existed.</p>
      <p>
        <a href="/">Back to SkinLabs</a> · <a href="/briefings">Briefings</a> · <a href="/reviews">Reviews</a>
      </p>
    </main>
  )
}

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultError,
    defaultNotFoundComponent: DefaultNotFound,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
