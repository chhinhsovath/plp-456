import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';
import { randomUUID } from 'crypto';

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

    const { sessionInfo, evaluationData, studentAssessment } = await request.json();
    
    // Update the main inspection session with sessionInfo data
    const inspectionSessionData: any = {};
    
    if (sessionInfo) {
      // Map sessionInfo fields directly to the Prisma fields which match the database column names
      if (sessionInfo.province !== undefined) inspectionSessionData.province = sessionInfo.province;
      if (sessionInfo.district !== undefined) inspectionSessionData.district = sessionInfo.district;
      if (sessionInfo.commune !== undefined) inspectionSessionData.commune = sessionInfo.commune;
      if (sessionInfo.village !== undefined) inspectionSessionData.village = sessionInfo.village;
      if (sessionInfo.school !== undefined) inspectionSessionData.school = sessionInfo.school;
      if (sessionInfo.nameOfTeacher !== undefined) inspectionSessionData.nameOfTeacher = sessionInfo.nameOfTeacher;
      if (sessionInfo.sex !== undefined) inspectionSessionData.sex = sessionInfo.sex;
      if (sessionInfo.employmentType !== undefined) inspectionSessionData.employmentType = sessionInfo.employmentType;
      if (sessionInfo.sessionTime !== undefined) inspectionSessionData.sessionTime = sessionInfo.sessionTime;
      if (sessionInfo.subject !== undefined) inspectionSessionData.subject = sessionInfo.subject;
      if (sessionInfo.chapter !== undefined) inspectionSessionData.chapter = sessionInfo.chapter;
      if (sessionInfo.lesson !== undefined) inspectionSessionData.lesson = sessionInfo.lesson;
      if (sessionInfo.title !== undefined) inspectionSessionData.title = sessionInfo.title;
      if (sessionInfo.subTitle !== undefined) inspectionSessionData.subTitle = sessionInfo.subTitle;
      if (sessionInfo.grade !== undefined) inspectionSessionData.grade = parseInt(String(sessionInfo.grade));
      if (sessionInfo.totalMale !== undefined) inspectionSessionData.totalMale = parseInt(String(sessionInfo.totalMale));
      if (sessionInfo.totalFemale !== undefined) inspectionSessionData.totalFemale = parseInt(String(sessionInfo.totalFemale));
      if (sessionInfo.totalAbsent !== undefined) inspectionSessionData.totalAbsent = parseInt(String(sessionInfo.totalAbsent));
      if (sessionInfo.totalAbsentFemale !== undefined) inspectionSessionData.totalAbsentFemale = parseInt(String(sessionInfo.totalAbsentFemale));
      if (sessionInfo.academicYear !== undefined) inspectionSessionData.academicYear = sessionInfo.academicYear;
      if (sessionInfo.semester !== undefined) inspectionSessionData.semester = parseInt(String(sessionInfo.semester));
      if (sessionInfo.lessonDurationMinutes !== undefined) inspectionSessionData.lessonDurationMinutes = parseInt(String(sessionInfo.lessonDurationMinutes));
      if (sessionInfo.generalNotes !== undefined) inspectionSessionData.generalNotes = sessionInfo.generalNotes;

      // Handle date/time fields that need parsing
      if (sessionInfo.inspectionDate) {
        inspectionSessionData.inspectionDate = new Date(sessionInfo.inspectionDate);
      }
      if (sessionInfo.startTime) {
        // Convert to Time format for PostgreSQL
        const startTime = new Date(sessionInfo.startTime);
        inspectionSessionData.startTime = startTime;
      }
      if (sessionInfo.endTime) {
        // Convert to Time format for PostgreSQL
        const endTime = new Date(sessionInfo.endTime);
        inspectionSessionData.endTime = endTime;
      }
    }

    // Update the inspection session
    const updatedObservation = await prisma.inspectionSession.update({
      where: { id },
      data: {
        ...inspectionSessionData,
        updatedAt: new Date()
      }
    });

    // Handle evaluation data - update evaluation records
    if (evaluationData) {
      // Delete existing evaluation records for this session
      await prisma.evaluationRecord.deleteMany({
        where: { inspectionSessionId: id }
      });

      // Create new evaluation records based on the evaluation data
      const evaluationRecords = [];
      
      for (const [key, value] of Object.entries(evaluationData)) {
        if (key.startsWith('indicator_') && key !== 'evaluationLevels') {
          const indicatorNumber = parseInt(key.replace('indicator_', ''));
          
          // Find the field by indicator sequence
          const masterField = await prisma.masterField.findUnique({
            where: { indicatorSequence: indicatorNumber }
          });

          if (masterField && value !== undefined) {
            evaluationRecords.push({
              id: randomUUID(),
              inspectionSessionId: id,
              fieldId: masterField.fieldId,
              scoreValue: String(value),
              notes: evaluationData[`${key}_comment`] || null,
              createdBy: session.email || null
            });
          }
        }
      }

      if (evaluationRecords.length > 0) {
        await prisma.evaluationRecord.createMany({
          data: evaluationRecords
        });
      }
    }

    // Handle student assessment data
    if (studentAssessment) {
      // Delete existing student assessment data for this session
      await prisma.studentAssessmentSession.deleteMany({
        where: { inspectionSessionId: id }
      });

      // Create new student assessment session
      const assessmentSessionId = randomUUID();
      const studentAssessmentSession = await prisma.studentAssessmentSession.create({
        data: {
          assessmentId: assessmentSessionId,
          inspectionSessionId: id,
          assessmentType: 'sample_students',
          assessmentDate: new Date()
        }
      });

      // Create subjects
      if (studentAssessment.subjects) {
        for (const subject of studentAssessment.subjects) {
          await prisma.assessmentSubject.create({
            data: {
              subjectId: randomUUID(),
              assessmentId: assessmentSessionId,
              subjectNameKm: subject.name_km,
              subjectNameEn: subject.name_en,
              subjectOrder: subject.order,
              maxScore: subject.max_score
            }
          });
        }
      }

      // Create students
      if (studentAssessment.students) {
        for (const student of studentAssessment.students) {
          await prisma.assessmentStudent.create({
            data: {
              studentId: randomUUID(),
              assessmentId: assessmentSessionId,
              studentIdentifier: student.identifier,
              studentOrder: student.order,
              studentName: student.name || null,
              studentGender: student.gender
            }
          });
        }
      }

      // Create scores
      if (studentAssessment.scores) {
        const subjects = await prisma.assessmentSubject.findMany({
          where: { assessmentId: assessmentSessionId },
          orderBy: { subjectOrder: 'asc' }
        });
        
        const students = await prisma.assessmentStudent.findMany({
          where: { assessmentId: assessmentSessionId },
          orderBy: { studentOrder: 'asc' }
        });

        for (const [subjectKey, subjectScores] of Object.entries(studentAssessment.scores as Record<string, any>)) {
          const subjectIndex = parseInt(subjectKey.replace('subject_', '')) - 1;
          const subject = subjects[subjectIndex];
          
          if (subject && typeof subjectScores === 'object') {
            for (const [studentKey, score] of Object.entries(subjectScores)) {
              const studentIndex = parseInt(studentKey.replace('student_', '')) - 1;
              const student = students[studentIndex];
              
              if (student && score !== undefined) {
                await prisma.studentScore.create({
                  data: {
                    scoreId: randomUUID(),
                    assessmentId: assessmentSessionId,
                    subjectId: subject.subjectId,
                    studentId: student.studentId,
                    score: parseFloat(String(score))
                  }
                });
              }
            }
          }
        }
      }
    }

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