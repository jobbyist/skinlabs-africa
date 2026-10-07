import { HeadContent, createRootRoute } from '@tanstack/react-router'
// The real, hashed SPA entry document the Vite build produces (dist/index.html), inlined at build time exactly like
// src/routes/$.ts does. `vite build` always runs before `build:tanstack-start`.
import spaIndexHtml from '../../dist/index.html?raw'
import { SPA_SHELL_MARKER } from '@/lib/routing/stripClientPreloads'
import { parseSpaShell, SSR_FALLBACK_ATTRIBUTE, SSR_FALLBACK_CSS, SSR_FALLBACK_JS_FLAG } from '@/lib/routing/spaShell'

/**
 * Document shell for every server-rendered content route (/briefings/:slug, /reviews/:slug, /ingredients/:slug,
 * /spotlight/:slug). See src/lib/routing/spaShell.ts for why: these URLs are entry points (shared links, search
 * results, push notifications, bookmarks, installed-app launches), and they must boot the REAL app — the same page a
 * card tap inside the app opens — while still answering with per-article metadata and readable content for
 * crawlers and no-JS clients. The TanStack client bundle is therefore NOT loaded (the Scripts component is deliberately not rendered): the SPA's own
 * entry script replaces the server-rendered fallback inside #root when it boots.
 *
 * Everything below mirrors index.html's static head (a test pins the shared values to that file).
 */
const shell = parseSpaShell(spaIndexHtml)

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Montserrat:wght@400;500;600;700;800&display=swap'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      // Fallback title (e.g. a 404); content routes set their own.
      { title: 'SkinLabs®' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
      // Default for anything a route does not describe (e.g. a 404). Content routes override it with index/follow.
      // `data-rh` hands the tag to react-helmet-async once the SPA boots, so no duplicate survives hydration-free takeover.
      { name: 'robots', content: 'noindex', 'data-rh': 'true' },
      { name: 'author', content: 'SkinLabs' },
      { name: 'twitter:site', content: '@SkinLabsZA' },
      { name: 'theme-color', content: '#000000' },
      // Installable app (docs/pwa.md): same iOS app meta as the SPA shell.
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'SkinLabs' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const },
      { rel: 'stylesheet', href: FONTS_HREF },
      { rel: 'preconnect', href: 'https://gnkpzijxuciiaamakgzm.supabase.co' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      ...shell.modulePreloads.map((href) => ({ rel: 'modulepreload', href, [SPA_SHELL_MARKER]: '' })),
      ...shell.stylesheets.map((href) => ({ rel: 'stylesheet', href, crossOrigin: 'anonymous' as const })),
    ],
    styles: [...shell.headStyles, SSR_FALLBACK_CSS].map((children) => ({ children })),
    scripts: [
      { children: SSR_FALLBACK_JS_FLAG },
      ...shell.headScripts.map((children) => ({ children })),
      ...shell.entryScripts.map((src) => ({ type: 'module', src, crossOrigin: 'anonymous' as const })),
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {shell.bodyScripts.map((js, i) => (
          <script key={i} dangerouslySetInnerHTML={{ __html: js }} />
        ))}
        <div id="root">
          <div {...{ [SSR_FALLBACK_ATTRIBUTE]: '' }}>{children}</div>
        </div>
      </body>
    </html>
  )
}
