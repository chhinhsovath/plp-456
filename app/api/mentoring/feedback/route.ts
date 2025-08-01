import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating feedback
const createFeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  feedbackType: z.string(),
  feedbackKm: z.string(),
  feedbackEn: z.string().optional(),
  priority: z.number().min(1).max(5).default(3),
});

// GET - Fetch feedback for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const isAddressed = searchParams.get('isAddressed');

    const where: any = {};

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (isAddressed !== null) {
      where.isAddressed = isAddressed === 'true';
    }

    const feedback = await prisma.mentoringFeedback.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST - Create new feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFeedbackSchema.parse(body);

    const feedback = await prisma.mentoringFeedback.create({
      data: validatedData,
    });

    // Send notification about new feedback
    const { MentoringNotificationService } = await import('@/lib/notifications/mentoring-notifications');
    await MentoringNotificationService.notifyFeedbackReceived(feedback.id);

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

// PATCH - Update feedback (mark as addressed)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('id');

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const feedback = await prisma.mentoringFeedback.update({
      where: { id: feedbackId },
      data: body,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}