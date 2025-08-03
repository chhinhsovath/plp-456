import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Clean up old drafts (older than 30 days)
export async function POST(request: NextRequest) {
  try {
    // Only allow cleanup in production with proper authorization
    // In a real app, you'd want to check for admin privileges or use a cron job
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.draftObservation.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { updatedAt: { lt: thirtyDaysAgo } }
        ]
      }
    });

    return NextResponse.json({
      message: `Cleaned up ${result.count} old drafts`,
      count: result.count
    });

  } catch (error) {
    console.error('Error cleaning up drafts:', error);
    return NextResponse.json(
      { error: 'Failed to clean up drafts' },
      { status: 500 }
    );
  }
}