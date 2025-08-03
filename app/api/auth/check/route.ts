import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token');
  const devAuthToken = cookieStore.get('dev-auth-token');
  
  // Get all cookies for debugging
  const allCookies = cookieStore.getAll();
  
  return NextResponse.json({
    authToken: authToken ? {
      name: authToken.name,
      value: authToken.value.substring(0, 20) + '...',
    } : null,
    devAuthToken: devAuthToken ? {
      name: devAuthToken.name,
      value: devAuthToken.value.substring(0, 20) + '...',
    } : null,
    allCookies: allCookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + '...'
    })),
    headers: {
      cookie: request.headers.get('cookie'),
    }
  });
}