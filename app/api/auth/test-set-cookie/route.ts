import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ 
    message: 'Cookie set',
    timestamp: new Date().toISOString() 
  });
  
  // Set a simple test cookie
  response.cookies.set('test-simple', 'test-value-123', {
    httpOnly: false, // Make it accessible to JS for testing
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  
  // Also set an httpOnly cookie
  response.cookies.set('test-http-only', 'secret-value-456', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  
  return response;
}