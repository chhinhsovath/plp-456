import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

// TypeScript interfaces for better type safety
interface SessionInfo {
  province: string;
  provinceCode?: string;
  provinceNameKh?: string;
  district: string;
  districtCode?: string;
  districtNameKh?: string;
  commune?: string;
  communeCode?: string;
  communeNameKh?: string;
  village?: string;
  villageCode?: string;
  villageNameKh?: string;
  cluster?: string;
  school: string;
  schoolId?: number | string;
  nameOfTeacher: string;
  sex: string;
  employmentType: string;
  sessionTime: string;
  subject: string;
  chapter?: string;
  lesson?: string;
  title?: string;
  subTitle?: string;
  inspectionDate: string;
  startTime?: string;
  endTime?: string;
  grade: number | string;
  totalMale: number | string;
  totalFemale: number | string;
  totalAbsent: number | string;
  totalAbsentFemale: number | string;
  inspectorName?: string;
  inspectorPosition?: string;
  inspectorOrganization?: string;
  academicYear?: string;
  semester?: number | string;
  lessonDurationMinutes?: number | string;
  generalNotes?: string;
}

interface EvaluationData {
  evaluationLevels?: number[];
  [key: string]: any; // For dynamic indicator fields
}

interface StudentAssessment {
  subjects?: Array<{
    name_km: string;
    name_en: string;
    order: number;
    max_score?: number;
  }>;
  students?: Array<{
    identifier: string;
    order: number;
    name?: string;
    gender?: string;
  }>;
  scores?: {
    [subjectKey: string]: {
      [studentKey: string]: number | string;
    };
  };
}

interface CreateObservationRequest {
  sessionInfo: SessionInfo;
  evaluationData: EvaluationData;
  studentAssessment: StudentAssessment;
  createdBy?: string;
  userRole?: string;
  offlineId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // All authenticated users can create observations - no role restrictions

    // Parse and validate request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { sessionInfo, evaluationData, studentAssessment, createdBy, userRole, offlineId }: CreateObservationRequest = data;

    // Validate required fields
    if (!sessionInfo || typeof sessionInfo !== 'object') {
      return NextResponse.json(
        { error: 'sessionInfo is required and must be an object' },
        { status: 400 }
      );
    }

    // Validate essential sessionInfo fields
    const requiredSessionFields = ['province', 'district', 'school', 'nameOfTeacher', 'subject', 'grade', 'inspectionDate'] as const;
    for (const field of requiredSessionFields) {
      if (!sessionInfo[field as keyof SessionInfo]) {
        return NextResponse.json(
          { error: `sessionInfo.${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate data types
    if (sessionInfo.grade && isNaN(parseInt(String(sessionInfo.grade)))) {
      return NextResponse.json(
        { error: 'sessionInfo.grade must be a valid number' },
        { status: 400 }
      );
    }

    // Validate inspection date
    if (sessionInfo.inspectionDate) {
      const inspectionDate = new Date(sessionInfo.inspectionDate);
      if (isNaN(inspectionDate.getTime())) {
        return NextResponse.json(
          { error: 'sessionInfo.inspectionDate must be a valid date' },
          { status: 400 }
        );
      }
    }

    // Start a transaction to ensure all data is saved together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create inspection session
      // Helper function to safely truncate strings and validate input
      const truncate = (str: string | null | undefined, maxLength: number): string | null => {
        if (!str) return null;
        if (typeof str !== 'string') {
          throw new Error(`Expected string but received ${typeof str}`);
        }
        return str.length > maxLength ? str.substring(0, maxLength) : str;
      };

      // Helper function to safely parse integers
      const safeParseInt = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      // Log data lengths for debugging
      console.log('Field lengths:', {
        lesson: sessionInfo.lesson?.length,
        chapter: sessionInfo.chapter?.length,
        subject: sessionInfo.subject?.length,
        title: sessionInfo.title?.length,
        subTitle: sessionInfo.subTitle?.length
      });

      // Validate commune field - it should be optional, not required
      const communeField = sessionInfo.commune || 'N/A';
      
      // Use camelCase field names as defined in Prisma schema
      const inspectionSession = await tx.inspectionSession.create({
        data: {
          province: truncate(sessionInfo.province, 100)!,
          provinceCode: truncate(sessionInfo.provinceCode, 10),
          provinceNameKh: truncate(sessionInfo.provinceNameKh, 100),
          district: truncate(sessionInfo.district, 100)!,
          districtCode: truncate(sessionInfo.districtCode, 10),
          districtNameKh: truncate(sessionInfo.districtNameKh, 100),
          commune: truncate(communeField, 100) || '',
          communeCode: truncate(sessionInfo.communeCode, 10),
          communeNameKh: truncate(sessionInfo.communeNameKh, 100),
          village: truncate(sessionInfo.village, 100),
          villageCode: truncate(sessionInfo.villageCode, 10),
          villageNameKh: truncate(sessionInfo.villageNameKh, 100),
          cluster: truncate(sessionInfo.cluster, 100),
          school: truncate(sessionInfo.school, 255)!,
          schoolId: sessionInfo.schoolId ? safeParseInt(sessionInfo.schoolId) : null,
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
          startTime: sessionInfo.startTime ? (
            sessionInfo.startTime.includes(':') 
              ? (() => {
                  try {
                    const [hours, minutes] = sessionInfo.startTime.split(':');
                    return new Date(1970, 0, 1, parseInt(hours, 10), parseInt(minutes, 10), 0);
                  } catch (e) {
                    console.warn('Invalid start time format:', sessionInfo.startTime);
                    return null;
                  }
                })()
              : (() => {
                  try {
                    return new Date(`1970-01-01T${sessionInfo.startTime}:00`);
                  } catch (e) {
                    console.warn('Invalid start time format:', sessionInfo.startTime);
                    return null;
                  }
                })()
          ) : null,
          endTime: sessionInfo.endTime ? (
            sessionInfo.endTime.includes(':')
              ? (() => {
                  try {
                    const [hours, minutes] = sessionInfo.endTime.split(':');
                    return new Date(1970, 0, 1, parseInt(hours, 10), parseInt(minutes, 10), 0);
                  } catch (e) {
                    console.warn('Invalid end time format:', sessionInfo.endTime);
                    return null;
                  }
                })()
              : (() => {
                  try {
                    return new Date(`1970-01-01T${sessionInfo.endTime}:00`);
                  } catch (e) {
                    console.warn('Invalid end time format:', sessionInfo.endTime);
                    return null;
                  }
                })()
          ) : null,
          grade: safeParseInt(sessionInfo.grade, 1),
          totalMale: safeParseInt(sessionInfo.totalMale, 0),
          totalFemale: safeParseInt(sessionInfo.totalFemale, 0),
          totalAbsent: safeParseInt(sessionInfo.totalAbsent, 0),
          totalAbsentFemale: safeParseInt(sessionInfo.totalAbsentFemale, 0),
          level: evaluationData?.evaluationLevels ? Math.max(...evaluationData.evaluationLevels) : 1,
          inspectorName: truncate(sessionInfo.inspectorName || session?.name, 255),
          inspectorPosition: truncate(sessionInfo.inspectorPosition || userRole || session?.role, 100),
          inspectorOrganization: truncate(sessionInfo.inspectorOrganization, 255),
          academicYear: truncate(sessionInfo.academicYear, 20),
          semester: sessionInfo.semester ? safeParseInt(sessionInfo.semester) : null,
          lessonDurationMinutes: sessionInfo.lessonDurationMinutes ? safeParseInt(sessionInfo.lessonDurationMinutes) : null,
          generalNotes: sessionInfo.generalNotes || null, // TEXT field, no limit
          createdBy: truncate(createdBy || session?.email, 255),
          userId: session?.userId || session?.id || null
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
          const indicatorSequence = parseInt(key.replace('indicator_', ''));
          
          // Find the master field by indicator sequence
          const masterField = await tx.masterField.findUnique({
            where: { indicatorSequence: indicatorSequence }
          });
          
          if (masterField) {
            evaluationRecords.push({
              inspectionSessionId: inspectionSession.id,
              fieldId: masterField.fieldId,
              scoreValue: value as string,
              notes: commentMap.get(indicatorSequence) || null,
              createdBy: session?.email || null
            });
          } else {
            console.warn(`Master field not found for indicator sequence: ${indicatorSequence}`);
          }
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
          
          if (subjectId && typeof studentScores === 'object' && studentScores !== null) {
            for (const [studentKey, score] of Object.entries(studentScores)) {
              const studentOrder = parseInt(studentKey.replace('student_', ''));
              const studentId = studentMap.get(studentOrder);
              
              if (studentId && score !== null && score !== undefined) {
                const parsedScore = parseFloat(score as string);
                if (!isNaN(parsedScore) && parsedScore >= 0) {
                  scoreRecords.push({
                    assessmentId: assessment.assessmentId,
                    subjectId: subjectId,
                    studentId: studentId,
                    score: parsedScore
                  });
                } else {
                  console.warn(`Invalid score value: ${score} for student ${studentId}, subject ${subjectId}`);
                }
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
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10))); // Cap at 100
    const skip = (page - 1) * limit;

    // Build where clause with proper validation
    const whereClause: any = { 
      isActive: true 
    };
    
    // Add search filter if provided
    const searchTerm = searchParams.get('search')?.trim();
    if (searchTerm) {
      whereClause.OR = [
        { school: { contains: searchTerm, mode: 'insensitive' } },
        { nameOfTeacher: { contains: searchTerm, mode: 'insensitive' } },
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { province: { contains: searchTerm, mode: 'insensitive' } },
        { district: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Add date range filter if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      whereClause.inspectionDate = {};
      if (startDate) {
        whereClause.inspectionDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.inspectionDate.lte = new Date(endDate);
      }
    }

    // Add level filter if provided
    const level = searchParams.get('level');
    if (level && !isNaN(parseInt(level, 10))) {
      whereClause.level = parseInt(level, 10);
    }

    // Optimized query to reduce data fetching - only get essential fields for list view
    const [observations, total] = await Promise.all([
      prisma.inspectionSession.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          province: true,
          district: true,
          school: true,
          nameOfTeacher: true,
          subject: true,
          grade: true,
          level: true,
          inspectionDate: true,
          inspectionStatus: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          // Only fetch minimal user data needed for the list view
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
          // Remove heavy nested includes for list view - these should only be fetched on detail view
        }
      }),
      prisma.inspectionSession.count({ where: whereClause })
    ]);

    // Validate pagination parameters
    const totalPages = Math.ceil(total / limit);
    if (page > totalPages && totalPages > 0) {
      return NextResponse.json(
        { error: 'Page number exceeds total pages' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      observations,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching observations:', error);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to fetch observations' 
      : `Failed to fetch observations: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}