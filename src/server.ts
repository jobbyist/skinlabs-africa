import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { stripClientPreloadsFromResponse } from '@/lib/routing/stripClientPreloads'

// Custom server entry (TanStack Start picks up src/server.ts). Identical to the default entry except that the HTML
// head loses the modulepreload hints for TanStack's own client chunks, which these routes never load — see
// src/lib/routing/stripClientPreloads.ts. Non-HTML responses (sitemap.xml, AMP stories, the SPA fallback) pass through.
export default createServerEntry({
  async fetch(request) {
    return stripClientPreloadsFromResponse(await handler.fetch(request))
  },
})
