import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export const COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days
};

export const DEV_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  ...COOKIE_OPTIONS,
  secure: false, // Always false in development
  domain: 'localhost',
};