# Unsplash API Integration

Automated image fetching from Unsplash for all content deployments with proper photographer attribution.

## Configuration

### Environment Variables

Add to your Vercel project environment variables:

```
VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
```

Get your Unsplash Access Key:
1. Visit https://unsplash.com/oauth/applications
2. Create a new application
3. Copy the Access Key
4. Add to Vercel: Project Settings → Environment Variables

### Local Development

Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
# Edit .env and add VITE_UNSPLASH_ACCESS_KEY
```

## Usage

### In Components (React Hook)

```typescript
import { useUnsplashImage } from "@/hooks/use-unsplash-image";

const { image, loading } = useUnsplashImage(
  "skincare moisturizer",
  "fallback-url.jpg"
);
```

### Direct API Usage

```typescript
import { fetchUnsplashImage } from "@/lib/unsplash";

const image = await fetchUnsplashImage("sunscreen product", "fallback.jpg");
console.log(image.alt); // Includes photographer attribution
```

## Features

- **Automatic caching**: Reduces API calls by caching results in memory
- **UTM tracking**: Adds proper attribution parameters to all URLs
- **Photographer credits**: Automatically includes photographer name in alt text
- **Fallback support**: Uses provided fallback URLs if API is unavailable
- **Type-safe**: Full TypeScript support with proper types

## Content Deployment

All future content (briefings, articles, etc.) will automatically use Unsplash API for cover images when the environment variable is configured. If not configured, falls back to hardcoded URLs.
