import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  return NextResponse.json({
    allCookies: cookieStore.getAll(),
    testSimple: cookieStore.get('test-simple'),
    testHttpOnly: cookieStore.get('test-http-only'),
    authToken: cookieStore.get('auth-token'),
    requestCookies: request.cookies.getAll(),
  });
}