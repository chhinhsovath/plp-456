import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createRequestSchema = z.object({
  observerId: z.string().uuid(),
  requestMessage: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  lessonTopic: z.string().optional(),
  focusAreas: z.array(z.string()),
  suggestedDate: z.string().datetime().optional(),
  location: z.string().optional(),
});

const respondToRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  responseMessage: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  location: z.string().optional(),
});

// GET - Fetch peer observations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // sent, received, all
    const status = searchParams.get('status');
    const userId = session.user.id;

    const where: any = {};

    if (type === 'sent') {
      where.requesterId = userId;
    } else if (type === 'received') {
      where.observerId = userId;
    } else {
      where.OR = [
        { requesterId: userId },
        { observerId: userId },
      ];
    }

    if (status) {
      where.status = status;
    }

    const observations = await prisma.peerObservation.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        observer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        feedback: true,
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ observations });
  } catch (error) {
    console.error('Error fetching peer observations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peer observations' },
      { status: 500 }
    );
  }
}

// POST - Create a peer observation request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRequestSchema.parse(body);

    // Check if observer exists and is a valid peer
    const observer = await prisma.user.findUnique({
      where: { id: validatedData.observerId },
    });

    if (!observer) {
      return NextResponse.json(
        { error: 'Observer not found' },
        { status: 404 }
      );
    }

    // Create peer observation request
    const observation = await prisma.peerObservation.create({
      data: {
        requesterId: session.user.id,
        observerId: validatedData.observerId,
        requestMessage: validatedData.requestMessage,
        subject: validatedData.subject,
        gradeLevel: validatedData.gradeLevel,
        lessonTopic: validatedData.lessonTopic,
        focusAreas: validatedData.focusAreas,
        scheduledDate: validatedData.suggestedDate ? new Date(validatedData.suggestedDate) : null,
        location: validatedData.location,
      },
      include: {
        requester: true,
        observer: true,
      },
    });

    // Send notification to observer
    const { MentoringNotificationService } = await import('@/lib/notifications/mentoring-notifications');
    await MentoringNotificationService.sendNotification({
      userId: validatedData.observerId,
      type: 'session_scheduled', // Reuse type
      title: 'សំណើសង្កេតពីមិត្តរួមការងារ',
      message: `${session.user.name} បានស្នើសុំឱ្យអ្នកសង្កេតការបង្រៀនរបស់គាត់`,
      relatedId: observation.id,
    });

    return NextResponse.json({ observation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating peer observation:', error);
    return NextResponse.json(
      { error: 'Failed to create peer observation request' },
      { status: 500 }
    );
  }
}

// PATCH - Respond to or update a peer observation
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const observationId = searchParams.get('id');
    const action = searchParams.get('action'); // respond, complete, cancel

    if (!observationId) {
      return NextResponse.json(
        { error: 'Observation ID is required' },
        { status: 400 }
      );
    }

    const observation = await prisma.peerObservation.findUnique({
      where: { id: observationId },
      include: {
        requester: true,
        observer: true,
      },
    });

    if (!observation) {
      return NextResponse.json(
        { error: 'Observation not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let notificationData: any = null;

    if (action === 'respond') {
      // Only observer can respond
      if (observation.observerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only the observer can respond to this request' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const validatedData = respondToRequestSchema.parse(body);

      updateData = {
        status: validatedData.status,
        responseMessage: validatedData.responseMessage,
      };

      if (validatedData.status === 'ACCEPTED' && validatedData.scheduledDate) {
        updateData.status = 'SCHEDULED';
        updateData.scheduledDate = new Date(validatedData.scheduledDate);
        updateData.location = validatedData.location || observation.location;

        // Create a mentoring session for the peer observation
        const mentoringSession = await prisma.mentoringSession.create({
          data: {
            relationshipId: observation.requesterId, // Using requester ID as placeholder
            sessionType: 'PEER_LEARNING',
            scheduledDate: updateData.scheduledDate,
            location: updateData.location,
            preSessionNotes: {
              type: 'peer_observation',
              observationId: observation.id,
              subject: observation.subject,
              gradeLevel: observation.gradeLevel,
              lessonTopic: observation.lessonTopic,
              focusAreas: observation.focusAreas,
            },
          },
        });

        updateData.sessionId = mentoringSession.id;
      }

      // Prepare notification
      notificationData = {
        userId: observation.requesterId,
        type: 'session_scheduled',
        title: validatedData.status === 'ACCEPTED' ? 'សំណើត្រូវបានទទួលយក' : 'សំណើត្រូវបានបដិសេធ',
        message: validatedData.status === 'ACCEPTED' 
          ? `${observation.observer.name} បានយល់ព្រមសង្កេតការបង្រៀនរបស់អ្នក`
          : `${observation.observer.name} មិនអាចសង្កេតការបង្រៀនរបស់អ្នកបានទេ`,
        relatedId: observation.id,
      };
    } else if (action === 'complete') {
      // Either party can mark as complete
      if (observation.requesterId !== session.user.id && observation.observerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to complete this observation' },
          { status: 403 }
        );
      }

      updateData = {
        status: 'COMPLETED',
        completedAt: new Date(),
      };

      // Update session status if exists
      if (observation.sessionId) {
        await prisma.mentoringSession.update({
          where: { id: observation.sessionId },
          data: { status: 'COMPLETED' },
        });
      }
    } else if (action === 'cancel') {
      // Either party can cancel
      if (observation.requesterId !== session.user.id && observation.observerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to cancel this observation' },
          { status: 403 }
        );
      }

      updateData = {
        status: 'CANCELLED',
      };

      // Cancel session if exists
      if (observation.sessionId) {
        await prisma.mentoringSession.update({
          where: { id: observation.sessionId },
          data: { status: 'CANCELLED' },
        });
      }
    }

    const updatedObservation = await prisma.peerObservation.update({
      where: { id: observationId },
      data: updateData,
      include: {
        requester: true,
        observer: true,
        feedback: true,
      },
    });

    // Send notification if needed
    if (notificationData) {
      const { MentoringNotificationService } = await import('@/lib/notifications/mentoring-notifications');
      await MentoringNotificationService.sendNotification(notificationData);
    }

    return NextResponse.json({ observation: updatedObservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating peer observation:', error);
    return NextResponse.json(
      { error: 'Failed to update peer observation' },
      { status: 500 }
    );
  }
}