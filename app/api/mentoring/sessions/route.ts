import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a mentoring session
const createSessionSchema = z.object({
  relationshipId: z.string().uuid(),
  sessionType: z.enum([
    'CLASSROOM_OBSERVATION',
    'LESSON_PLANNING',
    'REFLECTIVE_PRACTICE',
    'PEER_LEARNING',
    'FOLLOW_UP'
  ]),
  scheduledDate: z.string().datetime(),
  location: z.string().optional(),
  preSessionNotes: z.object({
    objectives: z.array(z.string()),
    focusAreas: z.array(z.string()),
    preparation: z.string().optional(),
  }).optional(),
});

// GET - Fetch mentoring sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('relationshipId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (relationshipId) {
      where.relationshipId = relationshipId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate);
      }
    }

    const sessions = await prisma.mentoringSession.findMany({
      where,
      include: {
        relationship: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        observations: {
          orderBy: { timestamp: 'asc' },
        },
        feedbackItems: {
          orderBy: { priority: 'asc' },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching mentoring sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentoring sessions' },
      { status: 500 }
    );
  }
}

// POST - Create a new mentoring session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    // Verify the relationship exists and is active
    const relationship = await prisma.mentoringRelationship.findFirst({
      where: {
        id: validatedData.relationshipId,
        status: 'ACTIVE',
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'Active mentoring relationship not found' },
        { status: 404 }
      );
    }

    const mentoringSession = await prisma.mentoringSession.create({
      data: {
        ...validatedData,
        scheduledDate: new Date(validatedData.scheduledDate),
      },
      include: {
        relationship: {
          include: {
            mentor: true,
            mentee: true,
          },
        },
      },
    });

    // Send notification about new session
    const { MentoringNotificationService } = await import('@/lib/notifications/mentoring-notifications');
    await MentoringNotificationService.notifySessionScheduled(mentoringSession.id);

    return NextResponse.json({ session: mentoringSession }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating mentoring session:', error);
    return NextResponse.json(
      { error: 'Failed to create mentoring session' },
      { status: 500 }
    );
  }
}

// PATCH - Update a mentoring session
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Handle date fields
    if (body.scheduledDate) {
      body.scheduledDate = new Date(body.scheduledDate);
    }
    if (body.actualDate) {
      body.actualDate = new Date(body.actualDate);
    }

    const mentoringSession = await prisma.mentoringSession.update({
      where: { id: sessionId },
      data: body,
      include: {
        relationship: {
          include: {
            mentor: true,
            mentee: true,
          },
        },
        observations: true,
        feedbackItems: true,
      },
    });

    return NextResponse.json({ session: mentoringSession });
  } catch (error) {
    console.error('Error updating mentoring session:', error);
    return NextResponse.json(
      { error: 'Failed to update mentoring session' },
      { status: 500 }
    );
  }
}