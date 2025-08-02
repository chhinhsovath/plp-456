import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All authenticated users can create observations
    // No role restrictions - all roles have access

    const data = await request.json();
    const { sessionInfo, evaluationData, studentAssessment, createdBy, userRole } = data;

    // Start a transaction to ensure all data is saved together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create inspection session
      const inspectionSession = await tx.inspectionSession.create({
        data: {
          province: sessionInfo.province,
          district: sessionInfo.district,
          commune: sessionInfo.commune,
          village: sessionInfo.village || null,
          cluster: sessionInfo.cluster || null,
          school: sessionInfo.school,
          nameOfTeacher: sessionInfo.nameOfTeacher,
          sex: sessionInfo.sex,
          employmentType: sessionInfo.employmentType,
          sessionTime: sessionInfo.sessionTime,
          subject: sessionInfo.subject,
          chapter: sessionInfo.chapter || null,
          lesson: sessionInfo.lesson || null,
          title: sessionInfo.title || null,
          subTitle: sessionInfo.subTitle || null,
          inspectionDate: new Date(sessionInfo.inspectionDate),
          startTime: sessionInfo.startTime || null,
          endTime: sessionInfo.endTime || null,
          grade: sessionInfo.grade,
          totalMale: sessionInfo.totalMale || 0,
          totalFemale: sessionInfo.totalFemale || 0,
          totalAbsent: sessionInfo.totalAbsent || 0,
          totalAbsentFemale: sessionInfo.totalAbsentFemale || 0,
          level: evaluationData.evaluationLevel || 1,
          inspectorName: sessionInfo.inspectorName || session.name || null,
          inspectorPosition: sessionInfo.inspectorPosition || userRole || null,
          inspectorOrganization: sessionInfo.inspectorOrganization || null,
          academicYear: sessionInfo.academicYear || null,
          semester: sessionInfo.semester || null,
          lessonDurationMinutes: sessionInfo.lessonDurationMinutes || null,
          generalNotes: sessionInfo.generalNotes || null,
          createdBy: createdBy || session.email,
          userId: session.userId
        }
      });

      // 2. Create evaluation records
      const evaluationRecords = [];
      for (const [key, value] of Object.entries(evaluationData)) {
        if (key.startsWith('indicator_') && value) {
          const fieldId = parseInt(key.replace('indicator_', ''));
          evaluationRecords.push({
            inspectionSessionId: inspectionSession.id,
            fieldId: fieldId,
            scoreValue: value as string,
            createdBy: session.email
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
              assessmentId: assessment.id,
              subjectNameKm: subject.name_km,
              subjectNameEn: subject.name_en,
              subjectOrder: subject.order,
              maxScore: subject.max_score || 100
            }
          });
          subjectMap.set(subject.order, createdSubject.id);
        }

        // Create students
        const studentMap = new Map();
        for (const student of studentAssessment.students) {
          const createdStudent = await tx.assessmentStudent.create({
            data: {
              assessmentId: assessment.id,
              studentIdentifier: student.identifier,
              studentOrder: student.order,
              studentName: student.name || null,
              studentGender: student.gender || null
            }
          });
          studentMap.set(student.order, createdStudent.id);
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
                  assessmentId: assessment.id,
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

  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Failed to create observation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
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