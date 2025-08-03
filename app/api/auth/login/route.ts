import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, comparePassword } from '@/lib/auth';
import { COOKIE_OPTIONS, DEV_COOKIE_OPTIONS } from '@/lib/cookie-helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }
    
    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Create response
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    // Set auth cookie with consistent settings
    const cookieOptions = process.env.NODE_ENV === 'production' ? COOKIE_OPTIONS : DEV_COOKIE_OPTIONS;
    
    response.cookies.set('auth-token', token, cookieOptions);
    
    // Also set a dev cookie in development for debugging
    if (process.env.NODE_ENV === 'development') {
      response.cookies.set('dev-auth-token', token, cookieOptions);
      console.log('[Login] Setting cookies:', {
        token: token.substring(0, 20) + '...',
        cookieOptions,
        cookies: response.cookies.getAll()
      });
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}