import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
import { rateLimit, authRateLimiter } from '@/lib/rate-limiter';
import { corsMiddleware, apiCors, uploadCors } from '@/lib/cors';
import { securityAuditLogger, AuditEventType, AuditSeverity } from '@/lib/security-audit';
import { checkInputRateLimit } from '@/lib/sanitization';

// Security headers configuration
const securityHeaders = {
  // HTTPS enforcement (production only)
  ...(process.env.NODE_ENV === 'production' ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  } : {}),
  
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  
  // Frame protection
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': process.env.NODE_ENV === 'production' ? [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://telegram.org",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://telegram.org",
    "frame-src 'self' https://telegram.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://oauth.telegram.org",
    "upgrade-insecure-requests",
  ].join('; ') : [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://cdn.jsdelivr.net https://telegram.org",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http: blob:",
    "connect-src 'self' http://localhost:* https://api.openai.com https://telegram.org",
    "frame-src 'self' https://telegram.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://oauth.telegram.org",
  ].join('; '),
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
  ].join(', '),
  
  // Cache control for security (removed to prevent redirect issues)
};

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/auth-redirect',
  '/api/auth/login',
  '/api/auth/telegram',
  '/api/auth/session',
  '/api/auth/test',
  '/api/auth/debug',
  '/api/auth/check',
  '/test-auth', // Temporary test page
  '/test-dashboard', // Temporary test dashboard
  '/test-session', // Test session page
  '/test-navigation', // Navigation test page
  '/api/health',
  '/api/public',
];

const rateLimitedPaths = [
  { path: '/api/auth/login', limiter: authRateLimiter },
  { path: '/api/auth/register', limiter: authRateLimiter },
  { path: '/api/auth/forgot-password', limiter: authRateLimiter },
];

const uploadPaths = [
  '/api/upload',
  '/api/files',
  '/api/resources/upload',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  // Add request ID to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Request-ID', requestId);

  // Create response with security headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HTTPS enforcement in production only
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https' &&
    !request.url.includes('localhost')
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }

  // CORS handling for API routes
  if (pathname.startsWith('/api')) {
    const corsConfig = uploadPaths.includes(pathname) ? uploadCors : apiCors;
    const corsHandler = corsMiddleware(corsConfig);
    
    // Handle CORS
    const corsResponse = await corsHandler(request, async () => response);
    
    // Apply rate limiting for specific paths
    const rateLimitConfig = rateLimitedPaths.find(config => pathname.startsWith(config.path));
    if (rateLimitConfig) {
      const limitedResponse = await rateLimitConfig.limiter(request, async () => corsResponse);
      return limitedResponse;
    }
    
    // For API routes, check auth unless public
    if (!publicRoutes.some(route => pathname.startsWith(route))) {
      let token = request.cookies.get('auth-token')?.value;
      
      // Also check dev-auth-token
      if (!token) {
        token = request.cookies.get('dev-auth-token')?.value;
      }
      
      if (!token) {
        await logUnauthorizedAccess(request, pathname);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401, headers: corsResponse.headers }
        );
      }

      try {
        const payload = verifyToken(token);
        if (!payload) {
          throw new Error('Invalid token');
        }

        // Add user info to headers
        requestHeaders.set('X-User-ID', payload.userId);
        requestHeaders.set('X-User-Role', payload.role);
        requestHeaders.set('X-User-Email', payload.email || '');

        // Check role-based access
        if (!checkRoleAccess(pathname, payload.role)) {
          await logAccessDenied(request, pathname, payload);
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403, headers: corsResponse.headers }
          );
        }

      } catch (error) {
        await logInvalidToken(request, pathname);
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401, headers: corsResponse.headers }
        );
      }
    }
    
    return corsResponse;
  }
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }
  
  // Allow static files and Next.js internals
  if (pathname.includes('/_next') || pathname.includes('/favicon.ico')) {
    return response;
  }
  
  // Skip auth check for dashboard routes if valid token exists
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('dev-auth-token')?.value;
    
    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload) {
          // Add user info to headers for server components
          requestHeaders.set('X-User-ID', payload.userId);
          requestHeaders.set('X-User-Role', payload.role);
          requestHeaders.set('X-User-Email', payload.email || '');
          
          // Return response with updated headers
          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        }
      } catch (error) {
        console.error('Token verification error in middleware:', error);
      }
    }
  }
  
  // Check for auth token
  let token = request.cookies.get('auth-token')?.value;
  
  // In development, also check dev cookie
  if (!token) {
    token = request.cookies.get('dev-auth-token')?.value;
  }
  
  // Also check Authorization header as fallback
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    // Redirect to login for non-API routes
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Return 401 for API routes
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify token for non-API routes
  try {
    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }

    // Add user info to headers
    requestHeaders.set('X-User-ID', payload.userId);
    requestHeaders.set('X-User-Role', payload.role);
    requestHeaders.set('X-User-Email', payload.email || '');

    // Check role-based access for dashboard pages
    if (!checkRoleAccess(pathname, payload.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Apply security headers to the response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Return response with updated headers
    return response;

  } catch (error) {
    // Clear invalid token and redirect to login
    const clearTokenResponse = NextResponse.redirect(new URL('/login', request.url));
    clearTokenResponse.cookies.set('auth-token', '', {
      expires: new Date(0),
      path: '/',
    });
    
    // Copy security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      clearTokenResponse.headers.set(key, value);
    });

    return clearTokenResponse;
  }
}

// Helper functions
function checkRoleAccess(pathname: string, userRole: string): boolean {
  // Allow all authenticated users to access everything
  return true;
}

async function logUnauthorizedAccess(request: NextRequest, pathname: string) {
  await securityAuditLogger.log({
    eventType: AuditEventType.ACCESS_DENIED,
    severity: AuditSeverity.MEDIUM,
    ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    action: `Unauthorized access attempt to ${pathname}`,
    result: 'FAILURE',
    metadata: {
      path: pathname,
      method: request.method,
    },
  });
}

async function logAccessDenied(request: NextRequest, pathname: string, payload: any) {
  await securityAuditLogger.log({
    eventType: AuditEventType.ACCESS_DENIED,
    severity: AuditSeverity.MEDIUM,
    userId: payload.userId,
    userEmail: payload.email || undefined,
    userRole: payload.role,
    ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    action: `Insufficient permissions for ${pathname}`,
    result: 'FAILURE',
    metadata: {
      path: pathname,
      userRole: payload.role,
    },
  });
}

async function logInvalidToken(request: NextRequest, pathname: string) {
  await securityAuditLogger.log({
    eventType: AuditEventType.LOGIN_FAILURE,
    severity: AuditSeverity.HIGH,
    ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
    userAgent: request.headers.get('user-agent') || undefined,
    action: 'Invalid authentication token',
    result: 'FAILURE',
    metadata: {
      path: pathname,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - manifest.json
     * - service worker
     * - icons
     * - offline.html
     * - test files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icon-.*\\.png|public|.*\\.html).*)',
  ],
};