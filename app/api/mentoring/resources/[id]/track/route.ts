import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// POST - Track view or download
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();
    const resourceId = params.id;

    if (!type || !['view', 'download'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid tracking type' },
        { status: 400 }
      );
    }

    // Increment the appropriate counter
    const updateData = type === 'view' 
      ? { viewCount: { increment: 1 } }
      : { downloadCount: { increment: 1 } };

    const resource = await prisma.mentoringResource.update({
      where: { id: resourceId },
      data: updateData,
      select: {
        viewCount: true,
        downloadCount: true,
      },
    });

    return NextResponse.json({ 
      success: true,
      viewCount: resource.viewCount,
      downloadCount: resource.downloadCount,
    });
  } catch (error) {
    console.error('Error tracking resource:', error);
    return NextResponse.json(
      { error: 'Failed to track resource' },
      { status: 500 }
    );
  }
}