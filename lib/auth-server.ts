import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return null;
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
      return null;
    }
    
    return {
      ...user,
      userId: user.id
    };
  } catch (error) {
    console.error('getServerSession error:', error);
    return null;
  }
}