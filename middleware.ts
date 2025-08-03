import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
// Security imports removed for development

// Basic security headers - minimal for development, should be enhanced for production
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
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
  '/api/health',
  '/api/public',
];

// Rate limiting and upload paths disabled for development

// Role access check function - allow all authenticated users to access all pages
function checkRoleAccess(pathname: string, role: string): boolean {
  // Allow all authenticated users to access all pages
  // Authentication is required, but no role restrictions
  return true;
}

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

  // Apply basic security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // API route handling
  if (pathname.startsWith('/api')) {
    
    // For API routes, check auth unless public
    if (!publicRoutes.some(route => pathname.startsWith(route))) {
      let token = request.cookies.get('auth-token')?.value;
      
      // Also check dev-auth-token
      if (!token) {
        token = request.cookies.get('dev-auth-token')?.value;
      }
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
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

        // All authenticated users can access all API endpoints
        // No role-based restrictions

      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }
  
  // Allow static files and Next.js internals
  if (pathname.includes('/_next') || pathname.includes('/favicon.ico')) {
    return response;
  }
  
  // Require authentication for all dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('dev-auth-token')?.value;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Dashboard access:', {
        pathname,
        hasAuthToken: !!request.cookies.get('auth-token')?.value,
        hasDevToken: !!request.cookies.get('dev-auth-token')?.value,
        token: token ? 'Present' : 'Missing'
      });
    }
    
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
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
      
      // All authenticated users can access all dashboard pages
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Clear invalid token and redirect to login
      const clearTokenResponse = NextResponse.redirect(new URL('/login', request.url));
      clearTokenResponse.cookies.set('auth-token', '', {
        expires: new Date(0),
        path: '/',
      });
      return clearTokenResponse;
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

    // Skip security headers

    // Return response with updated headers
    return response;

  } catch (error) {
    // Clear invalid token and redirect to login
    const clearTokenResponse = NextResponse.redirect(new URL('/login', request.url));
    clearTokenResponse.cookies.set('auth-token', '', {
      expires: new Date(0),
      path: '/',
    });
    
    // Skip security headers

    return clearTokenResponse;
  }
}

// Helper functions removed - no security logging needed for development

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