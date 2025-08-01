import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

// POST - Toggle favorite status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.resourceFavorite.findUnique({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId,
        },
      },
    });

    if (existingFavorite) {
      // Remove favorite
      await prisma.resourceFavorite.delete({
        where: { id: existingFavorite.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prisma.resourceFavorite.create({
        data: {
          userId: session.user.id,
          resourceId,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}