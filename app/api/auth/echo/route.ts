import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  return NextResponse.json({
    cookies: cookieStore.getAll(),
    headers: {
      cookie: request.headers.get('cookie'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    },
    time: new Date().toISOString(),
  });
}