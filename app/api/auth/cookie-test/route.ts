import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Get all cookies
  const allCookies = cookieStore.getAll();
  const authToken = cookieStore.get('auth-token');
  const devAuthToken = cookieStore.get('dev-auth-token');
  
  // Get cookies from request headers
  const cookieHeader = request.headers.get('cookie');
  
  return NextResponse.json({
    message: 'Cookie test',
    cookies: {
      all: allCookies,
      authToken: authToken,
      devAuthToken: devAuthToken,
      cookieHeader: cookieHeader,
    },
    headers: Object.fromEntries(request.headers.entries()),
  });
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    message: 'Cookie set',
    timestamp: new Date().toISOString(),
  });
  
  // Set test cookie
  response.cookies.set('test-cookie', 'test-value', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  
  return response;
}

// OPTIONS handler removed - not needed for same-origin requests