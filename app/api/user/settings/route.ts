import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';

async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      console.log('No auth token found in cookies for settings');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInfo = await getUserFromToken(token);
    if (!userInfo || !userInfo.userId) {
      console.log('Invalid token or no userId in settings:', userInfo);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure userId is a number
    const userId = typeof userInfo.userId === 'string' ? parseInt(userInfo.userId) : userInfo.userId;
    console.log('Fetching settings for userId:', userId);

    // Check if settings exist for this user
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (settings) {
      return NextResponse.json({
        notifications: settings.notifications || {
          email: true,
          push: false,
          observations: true,
          evaluations: true,
          reminders: true
        },
        display: settings.display || {
          theme: 'light',
          language: 'km',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24'
        },
        privacy: settings.privacy || {
          profileVisibility: 'team',
          showEmail: false,
          showPhone: false
        }
      });
    }

    // Return default settings if none exist
    return NextResponse.json({
      notifications: {
        email: true,
        push: false,
        observations: true,
        evaluations: true,
        reminders: true
      },
      display: {
        theme: 'light',
        language: 'km',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24'
      },
      privacy: {
        profileVisibility: 'team',
        showEmail: false,
        showPhone: false
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userInfo = await getUserFromToken(token);
    if (!userInfo || !userInfo.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { notifications, display, privacy } = body;

    // Ensure userId is a number
    const userId = typeof userInfo.userId === 'string' ? parseInt(userInfo.userId) : userInfo.userId;

    // Upsert user settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        notifications,
        display,
        privacy,
        updatedAt: new Date()
      },
      create: {
        userId,
        notifications,
        display,
        privacy
      }
    });

    return NextResponse.json({
      success: true,
      settings: {
        notifications: settings.notifications,
        display: settings.display,
        privacy: settings.privacy
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}