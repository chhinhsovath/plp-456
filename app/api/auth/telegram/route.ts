import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, verifyTelegramAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const authData = await request.json();
    
    // Verify Telegram auth data
    if (!verifyTelegramAuth(authData)) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }
    
    const { id, username, photo_url, first_name, last_name } = authData;
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(id) },
    });
    
    if (!user) {
      // Create new user with Director role by default
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(id),
          telegramUsername: username,
          telegramPhotoUrl: photo_url,
          name: `${first_name} ${last_name || ''}`.trim(),
          email: `telegram_${id}@plp.local`,
          role: 'DIRECTOR',
          auth_provider: 'TELEGRAM',
          isActive: true,
        },
      });
    } else {
      // Update user info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: username,
          telegramPhotoUrl: photo_url,
          name: `${first_name} ${last_name || ''}`.trim(),
        },
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set cookie
  const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Disabled for development
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        telegramUsername: user.telegramUsername,
        telegramPhotoUrl: user.telegramPhotoUrl,
      },
      token,
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}