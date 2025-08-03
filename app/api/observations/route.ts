import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // In development, create a mock session if none exists
    const effectiveSession = session || (process.env.NODE_ENV !== 'production' ? {
      id: 1,
      userId: 1,
      email: 'dev@example.com',
      name: 'Development User',
      role: 'TEACHER'
    } : null);
    
    if (!effectiveSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All authenticated users can create observations
    // No role restrictions - all roles have access

    const data = await request.json();
    const { sessionInfo, evaluationData, studentAssessment, createdBy, userRole, offlineId } = data;

    // Start a transaction to ensure all data is saved together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create inspection session
      // Helper function to truncate strings to max length
      const truncate = (str: string | null | undefined, maxLength: number): string | null => {
        if (!str) return null;
        return str.length > maxLength ? str.substring(0, maxLength) : str;
      };

      // Log data lengths for debugging
      console.log('Field lengths:', {
        lesson: sessionInfo.lesson?.length,
        chapter: sessionInfo.chapter?.length,
        subject: sessionInfo.subject?.length,
        title: sessionInfo.title?.length,
        subTitle: sessionInfo.subTitle?.length
      });

      // Use camelCase field names as defined in Prisma schema
      const inspectionSession = await tx.inspectionSession.create({
        data: {
          province: truncate(sessionInfo.province, 100)!,
          district: truncate(sessionInfo.district, 100)!,
          commune: truncate(sessionInfo.commune, 100)!,
          village: truncate(sessionInfo.village, 100),
          cluster: truncate(sessionInfo.cluster, 100),
          school: truncate(sessionInfo.school, 255)!,
          nameOfTeacher: truncate(sessionInfo.nameOfTeacher, 255)!,
          sex: truncate(sessionInfo.sex, 10)!,
          employmentType: truncate(sessionInfo.employmentType, 20)!,
          sessionTime: truncate(sessionInfo.sessionTime, 20)!,
          subject: truncate(sessionInfo.subject, 100)!,
          chapter: truncate(sessionInfo.chapter, 10),
          lesson: truncate(sessionInfo.lesson, 10),
          title: sessionInfo.title || null, // TEXT field, no limit
          subTitle: sessionInfo.subTitle || null, // TEXT field, no limit
          inspectionDate: new Date(sessionInfo.inspectionDate),
          startTime: sessionInfo.startTime ? new Date(`1970-01-01T${sessionInfo.startTime}:00`) : null,
          endTime: sessionInfo.endTime ? new Date(`1970-01-01T${sessionInfo.endTime}:00`) : null,
          grade: parseInt(sessionInfo.grade) || 1,
          totalMale: parseInt(sessionInfo.totalMale) || 0,
          totalFemale: parseInt(sessionInfo.totalFemale) || 0,
          totalAbsent: parseInt(sessionInfo.totalAbsent) || 0,
          totalAbsentFemale: parseInt(sessionInfo.totalAbsentFemale) || 0,
          level: evaluationData.evaluationLevels ? Math.max(...evaluationData.evaluationLevels) : 1,
          inspectorName: truncate(sessionInfo.inspectorName || effectiveSession.name, 255),
          inspectorPosition: truncate(sessionInfo.inspectorPosition || userRole, 100),
          inspectorOrganization: truncate(sessionInfo.inspectorOrganization, 255),
          academicYear: truncate(sessionInfo.academicYear, 20),
          semester: parseInt(sessionInfo.semester) || null,
          lessonDurationMinutes: parseInt(sessionInfo.lessonDurationMinutes) || null,
          generalNotes: sessionInfo.generalNotes || null, // TEXT field, no limit
          createdBy: truncate(createdBy || effectiveSession.email, 255),
          userId: effectiveSession.userId || effectiveSession.id || 1
        }
      });

      // 2. Create evaluation records
      const evaluationRecords = [];
      const commentMap = new Map<number, string>();
      
      // First, collect all comments
      for (const [key, value] of Object.entries(evaluationData)) {
        if (key.includes('_comment') && value) {
          const match = key.match(/indicator_(\d+)_comment/);
          if (match) {
            const fieldId = parseInt(match[1]);
            commentMap.set(fieldId, value as string);
          }
        }
      }
      
      // Then create evaluation records with comments
      for (const [key, value] of Object.entries(evaluationData)) {
        if (key.startsWith('indicator_') && !key.includes('_comment') && value) {
          const fieldId = parseInt(key.replace('indicator_', ''));
          evaluationRecords.push({
            inspectionSessionId: inspectionSession.id,
            fieldId: fieldId,
            scoreValue: value as string,
            notes: commentMap.get(fieldId) || null,
            createdBy: effectiveSession.email
          });
        }
      }

      if (evaluationRecords.length > 0) {
        await tx.evaluationRecord.createMany({
          data: evaluationRecords
        });
      }

      // 3. Create student assessment
      if (studentAssessment.subjects && studentAssessment.students && studentAssessment.scores) {
        const assessment = await tx.studentAssessmentSession.create({
          data: {
            inspectionSessionId: inspectionSession.id,
            assessmentType: 'sample_students',
            notes: null
          }
        });

        // Create subjects
        const subjectMap = new Map();
        for (const subject of studentAssessment.subjects) {
          const createdSubject = await tx.assessmentSubject.create({
            data: {
              assessmentId: assessment.assessmentId,
              subjectNameKm: subject.name_km,
              subjectNameEn: subject.name_en,
              subjectOrder: subject.order,
              maxScore: subject.max_score || 100
            }
          });
          subjectMap.set(subject.order, createdSubject.subjectId);
        }

        // Create students
        const studentMap = new Map();
        for (const student of studentAssessment.students) {
          const createdStudent = await tx.assessmentStudent.create({
            data: {
              assessmentId: assessment.assessmentId,
              studentIdentifier: student.identifier,
              studentOrder: student.order,
              studentName: student.name || null,
              studentGender: student.gender || null
            }
          });
          studentMap.set(student.order, createdStudent.studentId);
        }

        // Create scores
        const scoreRecords = [];
        for (const [subjectKey, studentScores] of Object.entries(studentAssessment.scores)) {
          const subjectOrder = parseInt(subjectKey.replace('subject_', ''));
          const subjectId = subjectMap.get(subjectOrder);
          
          if (subjectId && typeof studentScores === 'object') {
            for (const [studentKey, score] of Object.entries(studentScores)) {
              const studentOrder = parseInt(studentKey.replace('student_', ''));
              const studentId = studentMap.get(studentOrder);
              
              if (studentId && score !== null && score !== undefined) {
                scoreRecords.push({
                  assessmentId: assessment.assessmentId,
                  subjectId: subjectId,
                  studentId: studentId,
                  score: parseFloat(score as string)
                });
              }
            }
          }
        }

        if (scoreRecords.length > 0) {
          await tx.studentScore.createMany({
            data: scoreRecords
          });
        }
      }

      return inspectionSession;
    });

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      message: 'Observation created successfully' 
    });

  } catch (error: any) {
    console.error('Error creating observation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    // Return more specific error information
    return NextResponse.json(
      { 
        error: 'Failed to create observation',
        details: error.message || 'Unknown error',
        code: error.code
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = { isActive: true };
    
    // All users can see all observations (no role-based filtering)

    const [observations, total] = await Promise.all([
      prisma.inspectionSession.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          evaluationRecords: {
            include: {
              field: true
            }
          },
          studentAssessmentSessions: {
            include: {
              subjects: true,
              students: true,
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
      }),
      prisma.inspectionSession.count({ where: whereClause })
    ]);

    return NextResponse.json({
      observations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching observations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch observations' },
      { status: 500 }
    );
  }
}