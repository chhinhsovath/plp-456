import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/schools - Get all schools
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    
    // Also check dev-auth-token and Authorization header
    if (!token) {
      token = cookieStore.get('dev-auth-token')?.value;
    }
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (province) where.province = province;
    if (district) where.district = district;
    if (status) where.status = parseInt(status);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get schools with pagination
    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              observations: true,
              sessions: true,
              evaluations: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.school.count({ where }),
    ]);

    return NextResponse.json({
      schools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get schools error:', error);
    return NextResponse.json(
      { error: 'Failed to get schools', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/schools - Create new school
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    
    // Also check dev-auth-token and Authorization header
    if (!token) {
      token = cookieStore.get('dev-auth-token')?.value;
    }
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check permissions - only certain roles can create schools
    const allowedRoles: UserRole[] = ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'PROVINCIAL_DIRECTOR'];
    if (!allowedRoles.includes(payload.role as UserRole)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      code,
      cluster,
      commune,
      district,
      province,
      zone,
      totalStudents,
      totalTeachers,
      totalStudentsFemale,
      totalTeachersFemale,
      latitude,
      longitude,
    } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if school with code already exists
    const existingSchool = await prisma.school.findUnique({
      where: { code },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'School with this code already exists' },
        { status: 409 }
      );
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        code,
        cluster,
        commune,
        district,
        province,
        zone,
        totalStudents,
        totalTeachers,
        totalStudentsFemale,
        totalTeachersFemale,
        latitude,
        longitude,
        status: 1,
      },
      include: {
        _count: {
          select: {
            users: true,
            observations: true,
            sessions: true,
            evaluations: true,
          },
        },
      },
    });

    return NextResponse.json({ school }, { status: 201 });
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}