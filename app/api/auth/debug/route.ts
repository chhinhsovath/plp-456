import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-edge';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    if (!token) {
      return NextResponse.json({
        status: 'no token',
        message: 'No auth-token cookie found',
        cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
      });
    }
    
    // Try to decode without verification first
    const decoded = jwt.decode(token);
    
    // Try to verify
    let verified = null;
    let verifyError = null;
    try {
      verified = jwt.verify(token, JWT_SECRET);
    } catch (e: any) {
      verifyError = e.message;
    }
    
    return NextResponse.json({
      status: 'debug',
      token: token.substring(0, 50) + '...',
      decoded,
      verified,
      verifyError,
      JWT_SECRET: JWT_SECRET.substring(0, 10) + '...',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    });
  }
}