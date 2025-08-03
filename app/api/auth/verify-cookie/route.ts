import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // List all cookies server-side
  const allCookies = cookieStore.getAll();
  
  // Try to get auth token in different ways
  const authToken = cookieStore.get('auth-token');
  const devAuthToken = cookieStore.get('dev-auth-token');
  
  // Check request cookies directly
  const requestCookies = request.cookies.getAll();
  
  return NextResponse.json({
    serverCookies: {
      all: allCookies,
      authToken,
      devAuthToken,
    },
    requestCookies,
    headers: {
      cookie: request.headers.get('cookie'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    },
  }, { status: 200 });
}