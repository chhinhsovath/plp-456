import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/schools/[id] - Get single school
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

    const schoolId = parseInt(params.id);
    if (isNaN(schoolId)) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
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

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error('Get school error:', error);
    return NextResponse.json(
      { error: 'Failed to get school' },
      { status: 500 }
    );
  }
}

// PATCH /api/schools/[id] - Update school
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

    // Check permissions
    const allowedRoles: UserRole[] = ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'PROVINCIAL_DIRECTOR', 'DISTRICT_DIRECTOR'];
    if (!allowedRoles.includes(payload.role as UserRole)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const schoolId = parseInt(params.id);
    if (isNaN(schoolId)) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 });
    }

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
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
      status,
      totalStudents,
      totalTeachers,
      totalStudentsFemale,
      totalTeachersFemale,
      latitude,
      longitude,
      image,
    } = body;

    // Check if new code conflicts with another school
    if (code && code !== existingSchool.code) {
      const duplicateSchool = await prisma.school.findUnique({
        where: { code },
      });

      if (duplicateSchool) {
        return NextResponse.json(
          { error: 'School with this code already exists' },
          { status: 409 }
        );
      }
    }

    // Update school
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        code,
        cluster,
        commune,
        district,
        province,
        zone,
        status,
        totalStudents,
        totalTeachers,
        totalStudentsFemale,
        totalTeachersFemale,
        latitude,
        longitude,
        image,
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

    return NextResponse.json({ school });
  } catch (error) {
    console.error('Update school error:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

// DELETE /api/schools/[id] - Delete school
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

    // Only administrators can delete schools
    if (payload.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const schoolId = parseInt(params.id);
    if (isNaN(schoolId)) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 });
    }

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
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

    if (!existingSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Check if school has related data
    const hasRelatedData = 
      existingSchool._count.users > 0 ||
      existingSchool._count.observations > 0 ||
      existingSchool._count.sessions > 0 ||
      existingSchool._count.evaluations > 0;

    if (hasRelatedData) {
      // Soft delete by setting status to 0
      await prisma.school.update({
        where: { id: schoolId },
        data: { 
          status: 0,
          deletedAt: new Date(),
        },
      });

      return NextResponse.json({ 
        message: 'School deactivated successfully',
        softDelete: true,
      });
    } else {
      // Hard delete if no related data
      await prisma.school.delete({
        where: { id: schoolId },
      });

      return NextResponse.json({ 
        message: 'School deleted successfully',
        hardDelete: true,
      });
    }
  } catch (error) {
    console.error('Delete school error:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}