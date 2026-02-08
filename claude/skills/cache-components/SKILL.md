---
name: cache-components
description: This skill should be used when the user asks about "component caching", "React cache", "use cache", "cacheLife", "cacheTag", "revalidate", "ISR", "static generation", "dynamic rendering", "caching strategies", "data cache", "full route cache", or mentions "cache()", "revalidatePath", "revalidateTag". Provides guidance for Next.js caching and component optimization.
---

# Next.js Caching & Component Optimization

Guides you through implementing effective caching strategies in Next.js 15+ applications.

## Caching Overview

Next.js 15+ uses an explicit caching model with the `use cache` directive:

| Mechanism            | What                          | Where  | Purpose                    | Duration              |
| -------------------- | ----------------------------- | ------ | -------------------------- | --------------------- |
| Request Memoization  | Return values of functions    | Server | Re-use data in React tree  | Per-request lifecycle |
| `use cache`          | Function/component output     | Server | Cache across requests      | Configurable          |
| Full Route Cache     | HTML and RSC payload          | Server | Reduce rendering cost      | Persistent            |
| Router Cache         | RSC Payload                   | Client | Reduce server requests     | Session               |

## Server Component Caching

### Using `cache()` for Request Memoization

```tsx
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const user = await db.user.findUnique({ where: { id } });
  return user;
});

// Call multiple times - only executes once per request
const user1 = await getUser(id);
const user2 = await getUser(id); // Returns memoized result
```

### Using `use cache` Directive for Data Caching

The `use cache` directive replaces the deprecated `unstable_cache`. It can be applied at the function, component, or file level.

```tsx
import { cacheLife } from 'next/cache';

async function getCachedUser(id: string) {
  'use cache';
  cacheLife('hours');
  return await db.user.findUnique({ where: { id } });
}
```

### Cache Variants

```tsx
// Default shared cache
async function getProducts() {
  'use cache';
  return await db.product.findMany();
}

// Private cache (user-specific, can access cookies)
async function getRecommendations() {
  'use cache: private';
  cacheLife('minutes');
  const session = (await cookies()).get('session-id')?.value;
  return getPersonalizedData(session);
}

// Remote cache (shared across regions)
async function getGlobalConfig() {
  'use cache: remote';
  cacheLife('days');
  return await fetchConfig();
}
```

### Configuring Cache Lifetimes with `cacheLife`

Built-in profiles: `'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`

```tsx
import { cacheLife } from 'next/cache';

async function getData() {
  'use cache';
  cacheLife('hours'); // Use built-in profile
  return fetch('/api/data');
}
```

Custom profiles in `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
  },
  cacheLife: {
    custom: {
      stale: 3600,      // Client-side stale time (seconds)
      revalidate: 900,   // Server-side revalidate interval
      expire: 86400,     // Max lifetime
    },
  },
};

export default nextConfig;
```

### Cache Tagging with `cacheTag`

```tsx
import { cacheTag } from 'next/cache';

async function getPost(id: string) {
  'use cache';
  cacheTag(`post-${id}`, 'posts');
  return await db.post.findUnique({ where: { id } });
}
```

## Revalidation Strategies

### Time-based Revalidation

```tsx
// Using cacheLife in a use cache function
async function getData() {
  'use cache';
  cacheLife('hours'); // Revalidate every hour
  return fetch('https://api.example.com/data');
}

// In route segment config
export const revalidate = 3600;
```

### On-demand Revalidation

```tsx
import { revalidatePath, revalidateTag } from 'next/cache';

// Revalidate a specific path
revalidatePath('/blog');

// Revalidate by tag
revalidateTag('posts');
```

## Static vs Dynamic Rendering

### Force Static Generation

```tsx
export const dynamic = 'force-static';
export const revalidate = false;
```

### Force Dynamic Rendering

```tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

## Component Optimization Patterns

### Streaming with Suspense

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

### Parallel Data Fetching

```tsx
async function Page() {
  // Start both fetches in parallel
  const userPromise = getUser();
  const postsPromise = getPosts();

  // Wait for both
  const [user, posts] = await Promise.all([
    userPromise,
    postsPromise
  ]);

  return <div>...</div>;
}
```

## Best Practices

1. **Use Server Components by default**: They benefit from server-side caching
2. **Colocate data fetching**: Fetch data where it's used
3. **Use `cacheTag` for granular revalidation**: Tag related data for efficient cache invalidation
4. **Use `cacheLife` for explicit TTL**: Always specify cache lifetime explicitly
5. **Implement Suspense boundaries**: Improve perceived performance with streaming
6. **Avoid unnecessary client components**: Only use `'use client'` when needed
7. **Prefer `use cache` over `unstable_cache`**: `unstable_cache` is deprecated

## Debugging Cache

```tsx
// Temporarily disable cache with force-dynamic
export const dynamic = 'force-dynamic';

// Log cache hits
console.log('Fetching data at:', new Date().toISOString());
```
