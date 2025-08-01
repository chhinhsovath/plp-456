import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a mentoring relationship
const createRelationshipSchema = z.object({
  mentorId: z.string().uuid(),
  menteeId: z.string().uuid(),
  coordinatorId: z.string().uuid().optional(),
  focusAreas: z.array(z.string()),
  goals: z.object({
    shortTerm: z.array(z.string()),
    longTerm: z.array(z.string()),
  }).optional(),
  notes: z.string().optional(),
});

// GET - Fetch mentoring relationships
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // mentor, mentee, or coordinator
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      if (role === 'mentor') {
        where.mentorId = userId;
      } else if (role === 'mentee') {
        where.menteeId = userId;
      } else if (role === 'coordinator') {
        where.coordinatorId = userId;
      } else {
        // Return all relationships for this user
        where.OR = [
          { mentorId: userId },
          { menteeId: userId },
          { coordinatorId: userId },
        ];
      }
    }

    const relationships = await prisma.mentoringRelationship.findMany({
      where,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        sessions: {
          orderBy: { scheduledDate: 'desc' },
          take: 5,
        },
        progressReports: {
          orderBy: { reportDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ relationships });
  } catch (error) {
    console.error('Error fetching mentoring relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mentoring relationships' },
      { status: 500 }
    );
  }
}

// POST - Create a new mentoring relationship
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRelationshipSchema.parse(body);

    // Check if relationship already exists
    const existingRelationship = await prisma.mentoringRelationship.findFirst({
      where: {
        mentorId: validatedData.mentorId,
        menteeId: validatedData.menteeId,
        status: 'ACTIVE',
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'Active mentoring relationship already exists between these users' },
        { status: 400 }
      );
    }

    const relationship = await prisma.mentoringRelationship.create({
      data: {
        ...validatedData,
        startDate: new Date(),
      },
      include: {
        mentor: true,
        mentee: true,
        coordinator: true,
      },
    });

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating mentoring relationship:', error);
    return NextResponse.json(
      { error: 'Failed to create mentoring relationship' },
      { status: 500 }
    );
  }
}

// PATCH - Update a mentoring relationship
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('id');

    if (!relationshipId) {
      return NextResponse.json(
        { error: 'Relationship ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const relationship = await prisma.mentoringRelationship.update({
      where: { id: relationshipId },
      data: body,
      include: {
        mentor: true,
        mentee: true,
        coordinator: true,
      },
    });

    return NextResponse.json({ relationship });
  } catch (error) {
    console.error('Error updating mentoring relationship:', error);
    return NextResponse.json(
      { error: 'Failed to update mentoring relationship' },
      { status: 500 }
    );
  }
}