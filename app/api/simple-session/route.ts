import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('simple-session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    const user = JSON.parse(sessionCookie);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}