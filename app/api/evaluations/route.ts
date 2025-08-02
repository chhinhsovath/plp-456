import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/evaluations - Get all evaluations
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');
    const evaluatorId = searchParams.get('evaluatorId');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {};
    const userId = parseInt(payload.userId);

    // Filter based on user role
    if (payload.role === 'TEACHER') {
      where.teacherId = userId;
    } else if (payload.role === 'MENTOR' || payload.role === 'DIRECTOR') {
      // Get schools where user is assigned
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { schoolId: true },
      });
      if (user?.schoolId) {
        where.schoolId = user.schoolId;
      }
    }

    // Apply filters
    if (schoolId) where.schoolId = parseInt(schoolId);
    if (evaluatorId) where.evaluatorId = parseInt(evaluatorId);
    if (teacherId) where.teacherId = parseInt(teacherId);
    if (status) where.status = status;
    if (type) where.type = type;

    // Get evaluations with pagination
    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.evaluation.count({ where }),
    ]);

    return NextResponse.json({
      evaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get evaluations error:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluations' },
      { status: 500 }
    );
  }
}

// POST /api/evaluations - Create new evaluation
export async function POST(request: NextRequest) {
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

    // Check permissions - only certain roles can create evaluations
    const allowedRoles: UserRole[] = ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'MENTOR', 'DIRECTOR'];
    if (!allowedRoles.includes(payload.role as UserRole)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      schoolId,
      teacherId,
      date,
      criteria,
      scores,
      overallScore,
      feedback,
      recommendations,
      status = 'draft',
    } = body;

    // Validate required fields
    if (!title || !type || !schoolId || !date) {
      return NextResponse.json(
        { error: 'Title, type, school, and date are required' },
        { status: 400 }
      );
    }

    const evaluatorId = parseInt(payload.userId);

    // Create evaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        title,
        description,
        type,
        schoolId: parseInt(schoolId),
        teacherId: teacherId ? parseInt(teacherId) : null,
        evaluatorId,
        date: new Date(date),
        criteria,
        scores,
        overallScore,
        feedback,
        recommendations,
        status,
      },
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

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error('Create evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
}