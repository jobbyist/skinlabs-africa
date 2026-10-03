import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      // Installable app (docs/pwa.md): the SSR routes carry the same manifest + iOS app meta as the SPA shell.
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'SkinLabs' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { title: 'TanStack Start repo-root coexistence test' },
      { name: 'robots', content: 'noindex' },
    ],
    links: [{ rel: 'manifest', href: '/manifest.webmanifest' }],
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
        {children}
        <Scripts />
      </body>
    </html>
  )
}
