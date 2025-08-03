import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './error-handler';
import { errorLogger } from './error-logger';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  handler?: (req: NextRequest) => NextResponse | Promise<NextResponse>;
  skip?: (req: NextRequest) => boolean | Promise<boolean>;
  requestPropertyName?: string;
  store?: RateLimitStore;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

export interface RateLimitStore {
  increment(key: string): Promise<RateLimitInfo>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  resetAll(): Promise<void>;
}

// Simple in-memory store for Edge runtime
export class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }>;
  private windowMs: number;
  private cleanupInterval: number = 60000; // 1 minute
  private lastCleanup: number = Date.now();

  constructor(windowMs: number) {
    this.windowMs = windowMs;
    this.store = new Map();
  }

  private cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.lastCleanup = now;
      // Remove expired entries
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }
  }

  async increment(key: string): Promise<RateLimitInfo> {
    this.cleanup();
    
    const now = Date.now();
    const resetTime = now + this.windowMs;

    let entry = this.store.get(key);
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime };
    }

    entry.count++;
    this.store.set(key, entry);

    // Limit store size to prevent memory issues
    if (this.store.size > 10000) {
      // Remove oldest entries
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
      for (let i = 0; i < 1000; i++) {
        this.store.delete(entries[i][0]);
      }
    }

    return {
      limit: 0, // Will be set by the rate limiter
      current: entry.count,
      remaining: 0, // Will be calculated by the rate limiter
      resetTime: new Date(entry.resetTime),
    };
  }

  async decrement(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
      this.store.set(key, entry);
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }
}

// Default key generator
function defaultKeyGenerator(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return `rate-limit:${ip}`;
}

// Rate limiter middleware
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100,
    message = 'Too many requests, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    handler,
    skip,
    store = new MemoryStore(windowMs),
  } = config;

  return async function rateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Check if we should skip this request
    if (skip && await skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const info = await store.increment(key);
    
    info.limit = max;
    info.remaining = Math.max(0, max - info.current);

    // Log rate limit hit
    if (info.current > max) {
      await errorLogger.warn('Rate limit exceeded', {
        key,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        path: req.nextUrl.pathname,
        current: info.current,
        limit: max,
      });
    }

    // Add rate limit headers
    const headers = new Headers();
    
    if (standardHeaders) {
      headers.set('RateLimit-Limit', String(info.limit));
      headers.set('RateLimit-Remaining', String(info.remaining));
      headers.set('RateLimit-Reset', new Date(info.resetTime).toISOString());
    }

    if (legacyHeaders) {
      headers.set('X-RateLimit-Limit', String(info.limit));
      headers.set('X-RateLimit-Remaining', String(info.remaining));
      headers.set('X-RateLimit-Reset', String(Math.round(info.resetTime.getTime() / 1000)));
    }

    // Check if limit exceeded
    if (info.current > max) {
      headers.set('Retry-After', String(Math.round(windowMs / 1000)));
      
      if (handler) {
        const response = await handler(req);
        headers.forEach((value, key) => response.headers.set(key, value));
        return response;
      }

      return new NextResponse(
        JSON.stringify({
          error: {
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.round(windowMs / 1000),
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // Process the request
    try {
      const response = await next();
      
      // Add headers to successful response
      headers.forEach((value, key) => response.headers.set(key, value));

      // Optionally skip counting successful requests
      if (skipSuccessfulRequests && response.status < 400) {
        await store.decrement(key);
      }

      return response;
    } catch (error) {
      // Optionally skip counting failed requests
      if (skipFailedRequests) {
        await store.decrement(key);
      }
      throw error;
    }
  };
}

// Specialized rate limiters for different scenarios

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const email = req.nextUrl.searchParams.get('email') || 'unknown';
    return `auth:${ip}:${email}`;
  },
});

// API rate limiter with different tiers
export function createTieredRateLimiter(getUserTier: (req: NextRequest) => Promise<string>) {
  const tiers = {
    free: { windowMs: 60 * 1000, max: 60 }, // 60 requests per minute
    basic: { windowMs: 60 * 1000, max: 300 }, // 300 requests per minute
    pro: { windowMs: 60 * 1000, max: 1000 }, // 1000 requests per minute
    enterprise: { windowMs: 60 * 1000, max: 10000 }, // 10000 requests per minute
  };

  const stores = new Map<string, MemoryStore>();

  return async function tieredRateLimiter(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const tier = await getUserTier(req) || 'free';
    const config = tiers[tier as keyof typeof tiers] || tiers.free;

    if (!stores.has(tier)) {
      stores.set(tier, new MemoryStore(config.windowMs));
    }

    const limiter = rateLimit({
      ...config,
      store: stores.get(tier),
      keyGenerator: (req) => {
        const userId = req.headers.get('x-user-id') || 'anonymous';
        return `api:${tier}:${userId}`;
      },
    });

    return limiter(req, next);
  };
}

// Sliding window rate limiter for more accurate rate limiting
export class SlidingWindowStore implements RateLimitStore {
  private windows: Map<string, Array<{ timestamp: number; weight: number }>>;
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: number = 60000; // 1 minute
  private lastCleanup: number = Date.now();

  constructor(windowMs: number, maxRequests: number) {
    this.windows = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  private cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.lastCleanup = now;
      const windowStart = now - this.windowMs;
      
      // Clean up old windows
      for (const [key, window] of this.windows.entries()) {
        const filtered = window.filter(entry => entry.timestamp > windowStart);
        if (filtered.length === 0) {
          this.windows.delete(key);
        } else {
          this.windows.set(key, filtered);
        }
      }
    }
  }

  async increment(key: string): Promise<RateLimitInfo> {
    this.cleanup();
    
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create window
    let window = this.windows.get(key) || [];
    
    // Remove expired entries
    window = window.filter(entry => entry.timestamp > windowStart);
    
    // Add new entry
    window.push({ timestamp: now, weight: 1 });
    
    // Save window
    this.windows.set(key, window);

    // Limit windows size
    if (this.windows.size > 10000) {
      // Remove oldest windows
      const entries = Array.from(this.windows.entries());
      entries.sort((a, b) => {
        const aOldest = Math.min(...a[1].map(e => e.timestamp));
        const bOldest = Math.min(...b[1].map(e => e.timestamp));
        return aOldest - bOldest;
      });
      for (let i = 0; i < 1000; i++) {
        this.windows.delete(entries[i][0]);
      }
    }

    // Calculate current usage
    const current = window.reduce((sum, entry) => sum + entry.weight, 0);

    return {
      limit: this.maxRequests,
      current,
      remaining: Math.max(0, this.maxRequests - current),
      resetTime: new Date(window[0]?.timestamp + this.windowMs || now + this.windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    const window = this.windows.get(key);
    if (window && window.length > 0) {
      window.pop();
    }
  }

  async reset(key: string): Promise<void> {
    this.windows.delete(key);
  }

  async resetAll(): Promise<void> {
    this.windows.clear();
  }
}

// Distributed rate limiter using Redis (placeholder for Redis implementation)
export class RedisStore implements RateLimitStore {
  // This is a placeholder. In a real implementation, you would use Redis
  private memoryStore: MemoryStore;

  constructor(windowMs: number, redisClient?: any) {
    // Fallback to memory store if Redis is not available
    this.memoryStore = new MemoryStore(windowMs);
  }

  async increment(key: string): Promise<RateLimitInfo> {
    // In production, this would use Redis INCR with TTL
    return this.memoryStore.increment(key);
  }

  async decrement(key: string): Promise<void> {
    // In production, this would use Redis DECR
    return this.memoryStore.decrement(key);
  }

  async reset(key: string): Promise<void> {
    // In production, this would use Redis DEL
    return this.memoryStore.reset(key);
  }

  async resetAll(): Promise<void> {
    // In production, this would use Redis FLUSHDB
    return this.memoryStore.resetAll();
  }
}

// Rate limiter for file uploads
export const fileUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  keyGenerator: (req) => {
    const userId = req.headers.get('x-user-id') || 'anonymous';
    return `upload:${userId}`;
  },
});

// Rate limiter for API endpoints with burst allowance
export function burstRateLimiter(config: {
  sustained: { windowMs: number; max: number };
  burst: { windowMs: number; max: number };
}) {
  const sustainedStore = new MemoryStore(config.sustained.windowMs);
  const burstStore = new MemoryStore(config.burst.windowMs);

  return async function burstRateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = defaultKeyGenerator(req);

    // Check burst limit first
    const burstInfo = await burstStore.increment(key);
    if (burstInfo.current > config.burst.max) {
      return new NextResponse(
        JSON.stringify({
          error: {
            message: 'Burst rate limit exceeded',
            code: 'BURST_RATE_LIMIT_EXCEEDED',
          },
        }),
        { status: 429 }
      );
    }

    // Check sustained limit
    const sustainedInfo = await sustainedStore.increment(key);
    if (sustainedInfo.current > config.sustained.max) {
      return new NextResponse(
        JSON.stringify({
          error: {
            message: 'Sustained rate limit exceeded',
            code: 'SUSTAINED_RATE_LIMIT_EXCEEDED',
          },
        }),
        { status: 429 }
      );
    }

    return next();
  };
}