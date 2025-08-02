import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/evaluations/[id] - Get single evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
  const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: 'Invalid evaluation ID' }, { status: 400 });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            province: true,
            district: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // Check permissions
    const userId = parseInt(payload.userId);
    if (
      payload.role === 'TEACHER' && 
      evaluation.teacherId !== userId
    ) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Get evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluation' },
      { status: 500 }
    );
  }
}

// PATCH /api/evaluations/[id] - Update evaluation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
  const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: 'Invalid evaluation ID' }, { status: 400 });
    }

    // Check if evaluation exists and user has permission
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { evaluatorId: true, status: true },
    });

    if (!existingEvaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const userId = parseInt(payload.userId);
    
    // Only the original evaluator or administrators can update
    if (
      existingEvaluation.evaluatorId !== userId &&
      !['ADMINISTRATOR', 'ZONE', 'PROVINCIAL'].includes(payload.role as string)
    ) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Can't update if evaluation is completed
    if (existingEvaluation.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot update completed evaluation' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.criteria !== undefined) updateData.criteria = body.criteria;
    if (body.scores !== undefined) updateData.scores = body.scores;
    if (body.overallScore !== undefined) updateData.overallScore = body.overallScore;
    if (body.feedback !== undefined) updateData.feedback = body.feedback;
    if (body.recommendations !== undefined) updateData.recommendations = body.recommendations;
    if (body.status !== undefined) updateData.status = body.status;

    // Update evaluation
    const evaluation = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: updateData,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Update evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
}

// DELETE /api/evaluations/[id] - Delete evaluation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
  const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only administrators can delete evaluations
    if (!['ADMINISTRATOR', 'ZONE'].includes(payload.role as string)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: 'Invalid evaluation ID' }, { status: 400 });
    }

    // Check if evaluation exists
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!existingEvaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // Delete evaluation
    await prisma.evaluation.delete({
      where: { id: evaluationId },
    });

    return NextResponse.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete evaluation' },
      { status: 500 }
    );
  }
}