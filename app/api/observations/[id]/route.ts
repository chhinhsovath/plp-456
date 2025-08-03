import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const observation = await prisma.inspectionSession.findUnique({
      where: { id },
      include: {
        evaluationRecords: {
          include: {
            field: true
          }
        },
        studentAssessmentSessions: {
          include: {
            subjects: {
              orderBy: { subjectOrder: 'asc' }
            },
            students: {
              orderBy: { studentOrder: 'asc' }
            },
            scores: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!observation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    // All authenticated users can view any observation

    return NextResponse.json(observation);

  } catch (error) {
    console.error('Error fetching observation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch observation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    // Check if observation exists and user has permission
    const existingObservation = await prisma.inspectionSession.findUnique({
      where: { id }
    });

    if (!existingObservation) {
      return NextResponse.json({ error: 'Observation not found' }, { status: 404 });
    }

    // All authenticated users can update observations

    const data = await request.json();
    
    // Update observation
    const updatedObservation = await prisma.inspectionSession.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedObservation);

  } catch (error) {
    console.error('Error updating observation:', error);
    return NextResponse.json(
      { error: 'Failed to update observation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    // All authenticated users can delete observations

    // Soft delete
    await prisma.inspectionSession.update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, message: 'Observation deleted successfully' });

  } catch (error) {
    console.error('Error deleting observation:', error);
    return NextResponse.json(
      { error: 'Failed to delete observation' },
      { status: 500 }
    );
  }
}