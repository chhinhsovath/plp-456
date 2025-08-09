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
      console.log('No auth token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }

    const userInfo = await getUserFromToken(token);
    if (!userInfo || !userInfo.userId) {
      console.log('Invalid token or no userId in token:', userInfo);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure userId is a number
    const userId = typeof userInfo.userId === 'string' ? parseInt(userInfo.userId) : userInfo.userId;
    
    console.log('Fetching profile for userId:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        organization: true,
        position: true,
        bio: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      console.log('User not found for id:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
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
    const { name, phone, organization, position, bio } = body;

    // Ensure userId is a number
    const userId = typeof userInfo.userId === 'string' ? parseInt(userInfo.userId) : userInfo.userId;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        organization,
        position,
        bio,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        organization: true,
        position: true,
        bio: true,
        createdAt: true,
        lastLogin: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}