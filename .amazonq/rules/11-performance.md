# 11 — Performance

## Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## Current Monitoring

- **Vercel Analytics**: Traffic tracking
- **Vercel Speed Insights**: Real-user metrics

## Performance Optimizations (CURRENT)

### Code Splitting

**Lazy loading** with retry:

```typescript
import { lazyWithRetry } from "@/lib/chunkRecovery";

const AdminDashboard = lazyWithRetry(() => import("@/pages/AdminDashboard"));
```

**Handles**:

- Chunk loading failures
- Deployment skew (tab left open during redeploy)
- One guarded reload per 30s

### Image Optimization

**Build-time** compression:

- `vite-plugin-image-optimizer`
- `scripts/compress-images.ts`
- ~75% reduction (17.5MB → 4.3MB)

**Static images**: Optimized at build

**Dynamic images**: Served from CDNs (FTN, Pexels)

### Caching Strategy

**CDN caching** (`vercel.json`):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, s-maxage=120, stale-while-revalidate=604800"
        }
      ]
    }
  ]
}
```

- **Browser**: Revalidates (max-age=0)
- **CDN**: Caches 2 min (s-maxage=120)
- **Stale**: Serves up to 1 week while revalidating

**Static assets** (images, fonts, audio):

```json
{
  "source": "/:path*.(png|jpg|webp|svg|mp3|pdf|woff2)",
  "headers": [{
    "key": "Cache-Control",
    "value": "public, max-age=86400, stale-while-revalidate=2592000"
  }]
}
```

### React Query Defaults

```typescript
{
  staleTime: 5 * 60 * 1000,  // 5 min
  refetchOnWindowFocus: false
}
```

Reduces unnecessary refetches.

### SSR Performance

**Server-rendered routes** are faster:

- Content visible immediately
- Better FCP (First Contentful Paint)
- Crawlers get instant content

### Bundle Size

**Avoid unnecessary dependencies**:

- Use native APIs when possible
- Tree-shake unused code
- Lazy load heavy features

### Database Performance

**Indexes** on foreign keys:

```sql
CREATE INDEX idx_table_user_id ON table(user_id);
```

**RLS optimization**:

```sql
-- Use subquery (computed once)
USING ((select auth.uid()) = user_id)
```

## Performance Anti-Patterns

### Avoid

- **Huge JavaScript bundles**: Lazy load routes
- **Unnecessary client components**: Use server rendering when possible
- **N+1 queries**: Use joins or single queries
- **Unoptimized images**: Compress at build time
- **Blocking third-party scripts**: Load async/defer

## Mobile Performance

**Critical for SA market**:

- 3G/4G network speeds
- Limited data plans
- Lower-end devices

**Optimizations**:

- Compressed images
- Code splitting
- Fast mobile loading
- Touch targets ≥ 44×44px

## Known Performance Issues

1. **Podcast audio**: ~60MB uncompressed (needs ffmpeg re-encode)
2. **Deployment storage**: Frequent deploys accumulate
3. **Edge Function invocations**: CDN caching helps but not perfect

