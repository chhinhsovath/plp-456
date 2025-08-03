import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { nanoid } from 'nanoid';

// Generate a unique session key
function generateSessionKey() {
  return `obs-${Date.now()}-${nanoid(10)}`;
}

// GET - Load draft observation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const effectiveSession = session || {
      userId: 1,
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'TEACHER'
    };

    const searchParams = request.nextUrl.searchParams;
    const sessionKey = searchParams.get('sessionKey');
    
    if (!sessionKey) {
      return NextResponse.json({ error: 'Session key required' }, { status: 400 });
    }

    const draft = await prisma.draftObservation.findUnique({
      where: { sessionKey }
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Allow all users to access any draft - no ownership check

    return NextResponse.json({
      sessionKey: draft.sessionKey,
      step: draft.step,
      sessionInfo: draft.sessionInfo || {},
      evaluationData: draft.evaluationData || {},
      studentAssessment: draft.studentAssessment || {},
      status: draft.status,
      updatedAt: draft.updatedAt
    });

  } catch (error) {
    console.error('Error loading draft:', error);
    return NextResponse.json(
      { error: 'Failed to load draft' },
      { status: 500 }
    );
  }
}

// POST - Create or update draft observation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const effectiveSession = session || {
      userId: 1,
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'TEACHER'
    };

    const data = await request.json();
    const { sessionKey, step, sessionInfo, evaluationData, studentAssessment } = data;

    // If no session key provided, create a new draft
    if (!sessionKey) {
      const newSessionKey = generateSessionKey();
      const draft = await prisma.draftObservation.create({
        data: {
          sessionKey: newSessionKey,
          step: step || 1,
          sessionInfo: sessionInfo || {},
          evaluationData: evaluationData || {},
          studentAssessment: studentAssessment || {},
          userId: (effectiveSession as any).userId || (effectiveSession as any).id || 1,
          userEmail: effectiveSession.email,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      return NextResponse.json({
        sessionKey: draft.sessionKey,
        message: 'Draft created successfully'
      });
    }

    // Update existing draft
    const existingDraft = await prisma.draftObservation.findUnique({
      where: { sessionKey }
    });

    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Allow all users to update any draft - no ownership check

    // Update based on current step
    const updateData: any = {
      step,
      updatedAt: new Date()
    };

    if (sessionInfo !== undefined) {
      updateData.sessionInfo = sessionInfo;
    }
    if (evaluationData !== undefined) {
      updateData.evaluationData = evaluationData;
    }
    if (studentAssessment !== undefined) {
      updateData.studentAssessment = studentAssessment;
    }

    const updatedDraft = await prisma.draftObservation.update({
      where: { sessionKey },
      data: updateData
    });

    return NextResponse.json({
      sessionKey: updatedDraft.sessionKey,
      message: 'Draft updated successfully'
    });

  } catch (error: any) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save draft',
        details: error.message || error.toString(),
        code: error.code
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove draft after successful submission
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    const effectiveSession = session || {
      userId: 1,
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'TEACHER'
    };

    const { sessionKey } = await request.json();
    
    if (!sessionKey) {
      return NextResponse.json({ error: 'Session key required' }, { status: 400 });
    }

    const draft = await prisma.draftObservation.findUnique({
      where: { sessionKey }
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Allow all users to delete any draft - no ownership check

    await prisma.draftObservation.delete({
      where: { sessionKey }
    });

    return NextResponse.json({
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}