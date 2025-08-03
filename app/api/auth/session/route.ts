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
    
    // Also check Authorization header as fallback
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // In development, log cookie information only once
    if (process.env.NODE_ENV === 'development' && !request.headers.get('x-logged')) {
      console.log('[Session] Request from:', request.headers.get('referer'));
      console.log('[Session] Cookies available:', cookieStore.getAll().map(c => c.name));
      console.log('[Session] Auth token present:', !!token);
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Improved userId handling with better validation
    let userId: number;
    if (typeof payload.userId === 'string') {
      const parsedUserId = parseInt(payload.userId, 10);
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        console.error('Invalid userId in token:', payload.userId);
        return NextResponse.json(
          { error: 'Invalid user identifier' },
          { status: 401 }
        );
      }
      userId = parsedUserId;
    } else if (typeof payload.userId === 'number') {
      if (payload.userId <= 0) {
        console.error('Invalid userId in token:', payload.userId);
        return NextResponse.json(
          { error: 'Invalid user identifier' },
          { status: 401 }
        );
      }
      userId = payload.userId;
    } else {
      console.error('userId missing or invalid type in token:', typeof payload.userId);
      return NextResponse.json(
        { error: 'Invalid user identifier' },
        { status: 401 }
      );
    }
    
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
      console.error('User not found in database for userId:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to get session' 
      : `Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}