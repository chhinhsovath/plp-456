import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a progress report
const createProgressReportSchema = z.object({
  relationshipId: z.string().uuid(),
  reportPeriod: z.enum(['weekly', 'monthly', 'quarterly']),
  progressSummary: z.object({
    sessionsCompleted: z.number(),
    goalsAchieved: z.array(z.string()),
    areasImproved: z.array(z.string()),
    challengesFaced: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
  achievements: z.array(z.string()),
  challenges: z.array(z.string()),
  nextSteps: z.array(z.string()),
  overallRating: z.number().min(1).max(5).optional(),
});

// GET - Fetch progress reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('relationshipId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (relationshipId) {
      where.relationshipId = relationshipId;
    }

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.reportDate.lte = new Date(endDate);
      }
    }

    const reports = await prisma.mentoringProgressReport.findMany({
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
      },
      orderBy: { reportDate: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching progress reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress reports' },
      { status: 500 }
    );
  }
}

// POST - Create a new progress report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProgressReportSchema.parse(body);

    // Check if report already exists for this period
    const existingReport = await prisma.mentoringProgressReport.findFirst({
      where: {
        relationshipId: validatedData.relationshipId,
        reportPeriod: validatedData.reportPeriod,
        reportDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Within last week
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'A report for this period already exists' },
        { status: 400 }
      );
    }

    const report = await prisma.mentoringProgressReport.create({
      data: {
        ...validatedData,
        reportDate: new Date(),
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

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating progress report:', error);
    return NextResponse.json(
      { error: 'Failed to create progress report' },
      { status: 500 }
    );
  }
}

// Generate automatic progress summary
export async function generateProgressSummary(relationshipId: string, periodDays: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get sessions in the period
  const sessions = await prisma.mentoringSession.findMany({
    where: {
      relationshipId,
      scheduledDate: {
        gte: startDate,
        lte: new Date(),
      },
    },
    include: {
      observations: true,
      feedbackItems: true,
    },
  });

  // Get feedback items
  const allFeedback = sessions.flatMap(s => s.feedbackItems);
  
  // Calculate statistics
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalObservations = sessions.reduce((sum, s) => sum + s.observations.length, 0);
  const addressedFeedback = allFeedback.filter(f => f.isAddressed).length;
  const totalFeedback = allFeedback.length;

  // Group feedback by type
  const strengths = allFeedback
    .filter(f => f.feedbackType === 'strength')
    .map(f => f.feedbackKm);
  
  const improvements = allFeedback
    .filter(f => f.feedbackType === 'area_for_improvement')
    .map(f => f.feedbackKm);

  const suggestions = allFeedback
    .filter(f => f.feedbackType === 'suggestion')
    .map(f => f.feedbackKm);

  return {
    sessionsCompleted: completedSessions,
    totalSessions: sessions.length,
    totalObservations,
    feedbackStats: {
      total: totalFeedback,
      addressed: addressedFeedback,
      pending: totalFeedback - addressedFeedback,
    },
    strengths: [...new Set(strengths)].slice(0, 5),
    areasForImprovement: [...new Set(improvements)].slice(0, 5),
    suggestions: [...new Set(suggestions)].slice(0, 5),
  };
}