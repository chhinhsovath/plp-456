import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // In development, skip authentication
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch all active master fields (indicators)
    const indicators = await prisma.masterField.findMany({
      where: { isActive: true },
      orderBy: { indicatorSequence: 'asc' }
    });

    return NextResponse.json(indicators);

  } catch (error) {
    console.error('Error fetching indicators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch indicators' },
      { status: 500 }
    );
  }
}