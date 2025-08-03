import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// OPTIONS handler removed - not needed for same-origin requests

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    
    // In development, also check dev-auth-token
    if (!token && process.env.NODE_ENV === 'development') {
      token = cookieStore.get('dev-auth-token')?.value;
    }
    
    // In development, log cookie information only once
    if (process.env.NODE_ENV === 'development' && !request.headers.get('x-logged')) {
      console.log('[Session] Request from:', request.headers.get('referer'));
      console.log('[Session] Cookies available:', cookieStore.getAll().map(c => c.name));
      console.log('[Session] Auth token present:', !!token);
    }
    
    if (!token) {
      const response = NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
      
      // No CORS headers needed for same-origin requests
      
      return response;
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Handle both string and number userId from JWT
    const userId = typeof payload.userId === 'string' 
      ? parseInt(payload.userId) 
      : payload.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}