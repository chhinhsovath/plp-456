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
  
  const response = NextResponse.json({
    message: 'Cookie test',
    cookies: {
      all: allCookies,
      authToken: authToken,
      devAuthToken: devAuthToken,
      cookieHeader: cookieHeader,
    },
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
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
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}