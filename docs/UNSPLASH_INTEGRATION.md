# Cover Image Integration (Pexels + Unsplash)

Automated image fetching for briefings, articles and social previews with proper photographer attribution.

**Default provider: Pexels** (via `VITE_PEXELS_API_KEY`).  
**Fallback: Unsplash** (via `VITE_UNSPLASH_ACCESS_KEY`).

## Configuration

### Environment Variables (Vercel)

```
VITE_PEXELS_API_KEY=your_pexels_key_here
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

- Pexels free tier: 200 requests / hour, 20 000 / month.  
- The client caches results in-memory to stay well under the limits.

Get keys:
- Pexels: https://www.pexels.com/api/
- Unsplash: https://unsplash.com/oauth/applications

### Local Development

```bash
cp .env.example .env
# Edit .env and add the two keys
```

## Usage

### In Components (preferred)

```typescript
import { useCoverImage } from "@/hooks/use-unsplash-image"; // alias kept for compatibility

const { image, loading } = useCoverImage(
  "skincare moisturizer",
  "/fallback.jpg"
);
// image.creditName / image.creditUrl contain the attribution
```

### Direct API Usage

```typescript
import { fetchCoverImage } from "@/lib/pexels";

const image = await fetchCoverImage("sunscreen product", "fallback.jpg");
// Tries Pexels first, then Unsplash, then the fallback URL.
```

## Features

- **Pexels first** – preferred source for new and hydrated briefings.
- **Unsplash fallback** – used automatically when Pexels key is missing or the request fails.
- **Aggressive caching** – reduces API calls and respects rate limits.
- **Photographer credits** – "Photo by … on Pexels/Unsplash" with a link to the photo page.
- **Type-safe** – full TypeScript support.

## Existing briefings

Hard-coded Unsplash URLs in the data files continue to work. New or re-hydrated content that goes through `useCoverImage` / `fetchCoverImage` will prefer Pexels.
