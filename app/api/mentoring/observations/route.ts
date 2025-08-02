import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating an observation
const createObservationSchema = z.object({
  sessionId: z.string().uuid(),
  observationType: z.string(),
  observationKm: z.string(),
  observationEn: z.string().optional(),
  evidence: z.string().optional(),
});

// GET - Fetch observations for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const observations = await prisma.mentoringObservation.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ observations });
  } catch (error) {
    console.error('Error fetching observations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch observations' },
      { status: 500 }
    );
  }
}

// POST - Create a new observation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createObservationSchema.parse(body);

    const observation = await prisma.mentoringObservation.create({
      data: validatedData,
    });

    // Update session status to IN_PROGRESS if it's still SCHEDULED
    await prisma.mentoringSession.update({
      where: { 
        id: validatedData.sessionId,
        status: 'SCHEDULED'
      },
      data: { 
        status: 'IN_PROGRESS',
        actualDate: new Date()
      },
    });

    return NextResponse.json({ observation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Failed to create observation' },
      { status: 500 }
    );
  }
}