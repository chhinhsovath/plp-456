import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get('auth-token')?.value;
    
    // Also check dev-auth-token
    if (!token) {
      token = cookieStore.get('dev-auth-token')?.value;
    }
    
    if (!token) {
      return NextResponse.json({
        status: 'no token',
        message: 'No auth-token cookie found'
      });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({
        status: 'invalid token',
        message: 'Token verification failed',
        token: token.substring(0, 20) + '...'
      });
    }
    
    return NextResponse.json({
      status: 'valid',
      payload,
      token: token.substring(0, 20) + '...'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    });
  }
}