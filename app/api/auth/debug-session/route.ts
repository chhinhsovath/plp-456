import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authToken = cookieStore.get('auth-token');
    const devAuthToken = cookieStore.get('dev-auth-token');
    
    // Try to decode the token if it exists
    let tokenInfo = null;
    const token = authToken?.value || devAuthToken?.value;
    if (token) {
      try {
        tokenInfo = verifyToken(token);
      } catch (e: any) {
        tokenInfo = { error: e.message };
      }
    }
    
    return NextResponse.json({
      success: true,
      cookies: {
        all: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        authToken: authToken ? { exists: true, length: authToken.value.length } : null,
        devAuthToken: devAuthToken ? { exists: true, length: devAuthToken.value.length } : null,
      },
      tokenInfo,
      headers: {
        cookie: request.headers.get('cookie'),
        referer: request.headers.get('referer'),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}