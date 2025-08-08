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
      select: {
        id: true,
        province: true,
        provinceCode: true,
        provinceNameKh: true,
        district: true,
        districtCode: true,
        districtNameKh: true,
        commune: true,
        communeCode: true,
        communeNameKh: true,
        village: true,
        villageCode: true,
        villageNameKh: true,
        cluster: true,
        school: true,
        schoolId: true,
        nameOfTeacher: true,
        sex: true,
        employmentType: true,
        sessionTime: true,
        subject: true,
        chapter: true,
        lesson: true,
        title: true,
        subTitle: true,
        inspectionDate: true,
        startTime: true,
        endTime: true,
        grade: true,
        totalMale: true,
        totalFemale: true,
        totalAbsent: true,
        totalAbsentFemale: true,
        level: true,
        evaluationLevels: true, // Include the evaluation_levels array field
        inspectorName: true,
        inspectorPosition: true,
        inspectorOrganization: true,
        academicYear: true,
        semester: true,
        lessonDurationMinutes: true,
        inspectionStatus: true,
        generalNotes: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        isActive: true,
        userId: true,
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


    // Ensure evaluationLevels is properly set - fallback to single level if array is empty
    const responseData = {
      ...observation,
      evaluationLevels: observation.evaluationLevels && observation.evaluationLevels.length > 0 
        ? observation.evaluationLevels 
        : [observation.level]
    };

    return NextResponse.json(responseData);

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

    const requestData = await request.json();
    console.log('PUT /api/observations/[id] - Request data keys:', Object.keys(requestData));
    
    const { sessionInfo, evaluationData, studentAssessment } = requestData;
    
    console.log('PUT /api/observations/[id] - SessionInfo keys:', sessionInfo ? Object.keys(sessionInfo) : 'none');
    console.log('PUT /api/observations/[id] - EvaluationData keys:', evaluationData ? Object.keys(evaluationData) : 'none');
    
    // Update the main inspection session with sessionInfo data
    const inspectionSessionData: any = {};
    
    if (sessionInfo) {
      // Map sessionInfo fields directly to the Prisma fields which match the database column names
      if (sessionInfo.province !== undefined) inspectionSessionData.province = sessionInfo.province;
      if (sessionInfo.provinceCode !== undefined) inspectionSessionData.provinceCode = sessionInfo.provinceCode;
      if (sessionInfo.provinceNameKh !== undefined) inspectionSessionData.provinceNameKh = sessionInfo.provinceNameKh;
      if (sessionInfo.district !== undefined) inspectionSessionData.district = sessionInfo.district;
      if (sessionInfo.districtCode !== undefined) inspectionSessionData.districtCode = sessionInfo.districtCode;
      if (sessionInfo.districtNameKh !== undefined) inspectionSessionData.districtNameKh = sessionInfo.districtNameKh;
      if (sessionInfo.commune !== undefined) inspectionSessionData.commune = sessionInfo.commune;
      if (sessionInfo.communeCode !== undefined) inspectionSessionData.communeCode = sessionInfo.communeCode;
      if (sessionInfo.communeNameKh !== undefined) inspectionSessionData.communeNameKh = sessionInfo.communeNameKh;
      if (sessionInfo.village !== undefined) inspectionSessionData.village = sessionInfo.village;
      if (sessionInfo.villageCode !== undefined) inspectionSessionData.villageCode = sessionInfo.villageCode;
      if (sessionInfo.villageNameKh !== undefined) inspectionSessionData.villageNameKh = sessionInfo.villageNameKh;
      if (sessionInfo.cluster !== undefined) inspectionSessionData.cluster = sessionInfo.cluster;
      if (sessionInfo.school !== undefined) inspectionSessionData.school = sessionInfo.school;
      if (sessionInfo.schoolId !== undefined) inspectionSessionData.schoolId = parseInt(String(sessionInfo.schoolId));
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
      if (sessionInfo.inspectorName !== undefined) inspectionSessionData.inspectorName = sessionInfo.inspectorName;
      if (sessionInfo.inspectorPosition !== undefined) inspectionSessionData.inspectorPosition = sessionInfo.inspectorPosition;
      if (sessionInfo.inspectorOrganization !== undefined) inspectionSessionData.inspectorOrganization = sessionInfo.inspectorOrganization;
      if (sessionInfo.academicYear !== undefined) inspectionSessionData.academicYear = sessionInfo.academicYear;
      if (sessionInfo.semester !== undefined) inspectionSessionData.semester = parseInt(String(sessionInfo.semester));
      if (sessionInfo.lessonDurationMinutes !== undefined) inspectionSessionData.lessonDurationMinutes = parseInt(String(sessionInfo.lessonDurationMinutes));
      if (sessionInfo.generalNotes !== undefined) inspectionSessionData.generalNotes = sessionInfo.generalNotes;
      
      // Handle evaluation levels array
      if (sessionInfo.evaluationLevels !== undefined) {
        inspectionSessionData.evaluationLevels = Array.isArray(sessionInfo.evaluationLevels) 
          ? sessionInfo.evaluationLevels 
          : [sessionInfo.evaluationLevels];
        // Also update the single level field with the highest level for backward compatibility  
        inspectionSessionData.level = Math.max(...inspectionSessionData.evaluationLevels);
      }

      // Handle date/time fields that need parsing
      if (sessionInfo.inspectionDate) {
        try {
          inspectionSessionData.inspectionDate = new Date(sessionInfo.inspectionDate);
        } catch (e) {
          console.error('Invalid inspection date:', sessionInfo.inspectionDate);
        }
      }
      if (sessionInfo.startTime) {
        try {
          // Handle time string (HH:MM) format - convert to full DateTime
          if (typeof sessionInfo.startTime === 'string' && sessionInfo.startTime.includes(':')) {
            // Create a date object with time set to 1970-01-01 + the time
            const [hours, minutes] = sessionInfo.startTime.split(':');
            const startDateTime = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes), 0);
            inspectionSessionData.startTime = startDateTime;
          } else {
            inspectionSessionData.startTime = new Date(sessionInfo.startTime);
          }
        } catch (e) {
          console.error('Invalid start time:', sessionInfo.startTime);
        }
      }
      if (sessionInfo.endTime) {
        try {
          // Handle time string (HH:MM) format - convert to full DateTime
          if (typeof sessionInfo.endTime === 'string' && sessionInfo.endTime.includes(':')) {
            // Create a date object with time set to 1970-01-01 + the time
            const [hours, minutes] = sessionInfo.endTime.split(':');
            const endDateTime = new Date(1970, 0, 1, parseInt(hours), parseInt(minutes), 0);
            inspectionSessionData.endTime = endDateTime;
          } else {
            inspectionSessionData.endTime = new Date(sessionInfo.endTime);
          }
        } catch (e) {
          console.error('Invalid end time:', sessionInfo.endTime);
        }
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
    // Prefer evaluationData over sessionInfo, but handle both sources
    const indicatorData = evaluationData || sessionInfo || {};
    
    if (Object.keys(indicatorData).some(key => key.startsWith('indicator_'))) {
      console.log('Processing evaluation indicators...');
      
      // Delete existing evaluation records for this session
      await prisma.evaluationRecord.deleteMany({
        where: { inspectionSessionId: id }
      });

      // Create new evaluation records based on the evaluation data
      const evaluationRecords = [];
      const processedIndicators = new Set(); // Track processed indicators to avoid duplicates
      
      for (const [key, value] of Object.entries(indicatorData)) {
        if (key.startsWith('indicator_') && key !== 'evaluationLevels') {
          const indicatorNumber = parseInt(key.replace('indicator_', ''));
          
          // Skip if we've already processed this indicator
          if (processedIndicators.has(indicatorNumber)) {
            continue;
          }
          processedIndicators.add(indicatorNumber);
          
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
              notes: indicatorData[`${key}_comment`] || null,
              createdBy: session.email || null
            });
          }
        }
      }

      console.log('Creating evaluation records:', evaluationRecords.length);
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

    console.log('Observation updated successfully:', updatedObservation.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Observation updated successfully',
      observation: updatedObservation 
    });

  } catch (error) {
    console.error('Error updating observation:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to update observation', details: error instanceof Error ? error.message : 'Unknown error' },
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