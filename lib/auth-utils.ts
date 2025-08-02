import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'auth-token';
export const DEV_AUTH_COOKIE_NAME = 'dev-auth-token';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export const defaultCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false, // Disabled for development
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
};

export async function setAuthCookie(response: NextResponse, token: string, options?: CookieOptions) {
  const cookieOptions = { ...defaultCookieOptions, ...options };
  
  response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
  
  // Also set dev cookie in development
  if (process.env.NODE_ENV === 'development') {
    response.cookies.set(DEV_AUTH_COOKIE_NAME, token, cookieOptions);
  }
  
  return response;
}

export async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Check main auth cookie
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  
  // Check dev cookie in development
  if (!token && process.env.NODE_ENV === 'development') {
    token = request.cookies.get(DEV_AUTH_COOKIE_NAME)?.value;
  }
  
  // Check Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  return token || null;
}

export async function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    expires: new Date(0),
    path: '/',
  });
  
  if (process.env.NODE_ENV === 'development') {
    response.cookies.set(DEV_AUTH_COOKIE_NAME, '', {
      expires: new Date(0),
      path: '/',
    });
  }
  
  return response;
}