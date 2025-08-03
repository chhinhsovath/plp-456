import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    // No authentication required - allow all users

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