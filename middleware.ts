import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/api/auth/session',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow static files and Next.js internals
  if (pathname.includes('/_next') || pathname.includes('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // Check authentication for all other routes
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // Redirect to login if not authenticated
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Return 401 for API routes
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verify token
  try {
    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('Invalid token');
    }
    
    // Token is valid, allow access
    return NextResponse.next();
  } catch (error) {
    // Invalid token - clear it and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};