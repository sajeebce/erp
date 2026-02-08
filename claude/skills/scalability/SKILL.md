---
name: scalability
description: This skill should be used when the user asks about "scalability", "scaling", "performance", "high availability", "load balancing", "horizontal scaling", "vertical scaling", "microservices", "database scaling", or mentions "1000 users", "millions of requests", "production ready". Provides guidance for building scalable applications.
---

# Scalability Patterns & Best Practices

Guides you through building scalable, production-ready applications.

## Scalability Levels

| Level | Users | Requests/sec | Architecture |
|-------|-------|--------------|--------------|
| Small | 1-1K | <100 | Single server, monolith |
| Medium | 1K-100K | 100-1K | Load balanced, read replicas |
| Large | 100K-1M | 1K-10K | Microservices, sharding |
| Enterprise | 1M+ | 10K+ | Global distribution, CDN |

## Database Scaling

### Connection Pooling

```typescript
// packages/db/src/client.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// Use connection pooling for production
const connectionString = process.env.DATABASE_URL;

// PgBouncer or Prisma Data Proxy for serverless
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_POOL_URL || connectionString,
    },
  },
});

export { prisma as db };
```

### Read Replicas

```typescript
// lib/db/replicas.ts
const writeDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const readDb = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_REPLICA_URL } },
});

export const db = {
  // Use write DB for mutations
  write: writeDb,
  // Use read replica for queries
  read: readDb,
};

// Usage
await db.write.course.create({ data });
const courses = await db.read.course.findMany();
```

### Database Indexing

```prisma
model Course {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  published Boolean  @default(false)
  createdAt DateTime @default(now())

  // Composite index for common queries
  @@index([published, createdAt(sort: Desc)])
  @@index([title]) // For search
}

model Enrollment {
  userId   String
  courseId String

  // Composite unique + index
  @@unique([userId, courseId])
  @@index([courseId]) // For course stats
}
```

## Caching Layers

### Multi-Level Caching

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              CDN (Static Assets)                 │
│         Vercel Edge / Cloudflare                │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            Application Cache                     │
│     Next.js Full Route Cache + Data Cache       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Redis Cache                         │
│        Sessions, Rate Limiting, Hot Data        │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Database                            │
│     PostgreSQL with Read Replicas               │
└─────────────────────────────────────────────────┘
```

### Redis Caching

```typescript
// lib/cache/redis.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet(
  key: string,
  data: unknown,
  ttl: number = 3600
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(data));
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

## Horizontal Scaling

### Stateless Application Design

```typescript
// Bad: Storing state in memory
let userSessions = new Map(); // ❌ Lost on restart/scale

// Good: Storing state externally
import { redis } from "@/lib/cache";

async function getSession(token: string) {
  return redis.get(`session:${token}`); // ✅ Shared across instances
}
```

### Load Balancing

```nginx
# nginx.conf
upstream nextjs_upstream {
    least_conn; # Least connections algorithm
    server web1:3000;
    server web2:3000;
    server web3:3000;
    keepalive 64;
}

server {
    listen 80;
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Video Streaming Scalability

### CDN + Signed URLs

```typescript
// lib/video/signed-url.ts
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.S3_REGION });

export async function getVideoUrl(videoKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: videoKey,
  });

  // URL expires in 4 hours
  return getSignedUrl(s3, command, { expiresIn: 14400 });
}
```

### Adaptive Bitrate Streaming

```typescript
// Store multiple quality versions
const videoQualities = {
  "1080p": "videos/course-1/lesson-1/1080p.m3u8",
  "720p": "videos/course-1/lesson-1/720p.m3u8",
  "480p": "videos/course-1/lesson-1/480p.m3u8",
  "360p": "videos/course-1/lesson-1/360p.m3u8",
};
```

## Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }
}
```

## Background Jobs

```typescript
// Use a job queue for heavy operations
import { Queue, Worker } from "bullmq";

const videoQueue = new Queue("video-processing", {
  connection: { host: "redis", port: 6379 },
});

// Producer: Add job
await videoQueue.add("transcode", {
  videoId: "123",
  qualities: ["1080p", "720p", "480p"],
});

// Consumer: Process job
const worker = new Worker(
  "video-processing",
  async (job) => {
    // Process video transcoding
    await transcodeVideo(job.data);
  },
  { connection: { host: "redis", port: 6379 } }
);
```

## Monitoring & Observability

```typescript
// lib/monitoring/metrics.ts
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("lms-platform");

export const requestCounter = meter.createCounter("http_requests_total", {
  description: "Total HTTP requests",
});

export const responseTime = meter.createHistogram("http_response_time_ms", {
  description: "HTTP response time in milliseconds",
});

export const activeUsers = meter.createUpDownCounter("active_users", {
  description: "Currently active users",
});
```

## Scalability Checklist

### Application Layer
- [ ] Stateless design (no in-memory sessions)
- [ ] Connection pooling for database
- [ ] Redis for sessions and caching
- [ ] Background job processing
- [ ] Rate limiting implemented

### Database Layer
- [ ] Proper indexing on frequently queried columns
- [ ] Read replicas for read-heavy workloads
- [ ] Connection pooling (PgBouncer)
- [ ] Query optimization (EXPLAIN ANALYZE)
- [ ] Regular VACUUM and maintenance

### Infrastructure Layer
- [ ] Load balancer configured
- [ ] Auto-scaling policies
- [ ] CDN for static assets
- [ ] Monitoring and alerting
- [ ] Health check endpoints

### Content Delivery
- [ ] Videos served via CDN
- [ ] Signed URLs for secure access
- [ ] Adaptive bitrate streaming
- [ ] Image optimization (next/image)
