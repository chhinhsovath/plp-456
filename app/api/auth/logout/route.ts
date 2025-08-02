import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Clear the auth token cookie
  const cookieStore = await cookies();
  cookieStore.set('auth-token', '', {
    expires: new Date(0),
    path: '/',
  });

  // Also clear dev-auth-token if it exists
  cookieStore.set('dev-auth-token', '', {
    expires: new Date(0),
    path: '/',
  });

  return NextResponse.json({ success: true });
}