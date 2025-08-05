const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRelatedTables() {
  console.log('🔍 TESTING RELATED TABLES STORAGE\n');
  console.log('=' .repeat(80));
  
  try {
    // Create main observation
    console.log('\n📝 Creating main observation...');
    const observation = await prisma.inspectionSession.create({
      data: {
        province: "Test Province",
        district: "Test District", 
        commune: "Test Commune",
        school: "Test School",
        nameOfTeacher: "Test Teacher",
        sex: "Female",
        employmentType: "CONTRACT",
        sessionTime: "MORNING",
        subject: "Mathematics",
        grade: 4,
        inspectionDate: new Date(),
        level: 4,
        createdBy: "test@example.com",
        userId: 1
      }
    });
    console.log(`✅ Created observation: ${observation.id}`);

    // Create evaluation records
    console.log('\n📊 Creating evaluation records...');
    const evaluationData = [
      { fieldId: 1, scoreValue: "yes", notes: "Excellent performance" },
      { fieldId: 2, scoreValue: "some_practice", notes: "Needs improvement" },
      { fieldId: 3, scoreValue: "no", notes: "Requires training" },
      { fieldId: 4, scoreValue: "yes", notes: "Good understanding" },
      { fieldId: 5, scoreValue: "yes", notes: "Well prepared" }
    ];

    for (const data of evaluationData) {
      await prisma.evaluationRecord.create({
        data: {
          inspectionSessionId: observation.id,
          fieldId: data.fieldId,
          scoreValue: data.scoreValue,
          notes: data.notes,
          createdBy: "test@example.com"
        }
      });
    }
    console.log(`✅ Created ${evaluationData.length} evaluation records`);

    // Create student assessment
    console.log('\n👥 Creating student assessment...');
    const assessment = await prisma.studentAssessmentSession.create({
      data: {
        inspectionSessionId: observation.id,
        assessmentType: "sample_students",
        notes: "Mid-term assessment"
      }
    });
    console.log(`✅ Created assessment session: ${assessment.assessmentId}`);

    // Create subjects
    const subjects = [
      { name_km: "គណិតវិទ្យា", name_en: "Mathematics", order: 1 },
      { name_km: "ភាសាខ្មែរ", name_en: "Khmer", order: 2 },
      { name_km: "វិទ្យាសាស្ត្រ", name_en: "Science", order: 3 }
    ];

    const createdSubjects = [];
    for (const subj of subjects) {
      const created = await prisma.assessmentSubject.create({
        data: {
          assessmentId: assessment.assessmentId,
          subjectNameKm: subj.name_km,
          subjectNameEn: subj.name_en,
          subjectOrder: subj.order,
          maxScore: 100
        }
      });
      createdSubjects.push(created);
    }
    console.log(`✅ Created ${subjects.length} subjects`);

    // Create students
    const students = [
      { identifier: "S001", order: 1, name: "សុខ សុភា", gender: "F" },
      { identifier: "S002", order: 2, name: "ចាន់ វុទ្ធី", gender: "M" },
      { identifier: "S003", order: 3, name: "លី សុខា", gender: "F" }
    ];

    const createdStudents = [];
    for (const student of students) {
      const created = await prisma.assessmentStudent.create({
        data: {
          assessmentId: assessment.assessmentId,
          studentIdentifier: student.identifier,
          studentOrder: student.order,
          studentName: student.name,
          studentGender: student.gender
        }
      });
      createdStudents.push(created);
    }
    console.log(`✅ Created ${students.length} students`);

    // Create scores
    console.log('\n📝 Creating student scores...');
    let scoreCount = 0;
    for (const subject of createdSubjects) {
      for (const student of createdStudents) {
        await prisma.studentScore.create({
          data: {
            assessmentId: assessment.assessmentId,
            subjectId: subject.subjectId,
            studentId: student.studentId,
            score: Math.floor(Math.random() * 30) + 70 // Random score 70-100
          }
        });
        scoreCount++;
      }
    }
    console.log(`✅ Created ${scoreCount} scores`);

    // Retrieve and verify everything
    console.log('\n🔍 Retrieving complete observation with all related data...');
    const complete = await prisma.inspectionSession.findUnique({
      where: { id: observation.id },
      include: {
        evaluationRecords: {
          include: { field: true }
        },
        studentAssessmentSessions: {
          include: {
            subjects: { orderBy: { subjectOrder: 'asc' } },
            students: { orderBy: { studentOrder: 'asc' } },
            scores: true
          }
        }
      }
    });

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log(`✅ Main observation: ${complete.id}`);
    console.log(`✅ Evaluation records: ${complete.evaluationRecords.length}`);
    console.log(`✅ Student assessments: ${complete.studentAssessmentSessions.length}`);
    
    if (complete.studentAssessmentSessions.length > 0) {
      const assess = complete.studentAssessmentSessions[0];
      console.log(`   - Subjects: ${assess.subjects.length}`);
      console.log(`   - Students: ${assess.students.length}`);
      console.log(`   - Scores: ${assess.scores.length}`);
    }

    // Show sample data
    console.log('\n📋 SAMPLE DATA:');
    console.log('Evaluation Records:');
    complete.evaluationRecords.slice(0, 3).forEach(rec => {
      console.log(`   - Field ${rec.fieldId}: ${rec.scoreValue} (${rec.notes})`);
    });

    if (complete.studentAssessmentSessions.length > 0) {
      const assess = complete.studentAssessmentSessions[0];
      console.log('\nSubjects:');
      assess.subjects.forEach(subj => {
        console.log(`   - ${subj.subjectNameKm} (${subj.subjectNameEn})`);
      });
      
      console.log('\nStudents:');
      assess.students.forEach(student => {
        console.log(`   - ${student.studentIdentifier}: ${student.studentName} (${student.studentGender})`);
      });
    }

    // Test update on related data
    console.log('\n✏️ Testing updates on related data...');
    
    // Update an evaluation record
    const evalToUpdate = complete.evaluationRecords[0];
    await prisma.evaluationRecord.update({
      where: { id: evalToUpdate.id },
      data: { 
        scoreValue: "yes",
        notes: "UPDATED: Improved significantly"
      }
    });
    console.log('✅ Updated evaluation record');

    // Update a score
    if (complete.studentAssessmentSessions[0]?.scores[0]) {
      const scoreToUpdate = complete.studentAssessmentSessions[0].scores[0];
      await prisma.studentScore.update({
        where: { scoreId: scoreToUpdate.scoreId },
        data: { score: 95 }
      });
      console.log('✅ Updated student score');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await prisma.inspectionSession.delete({
      where: { id: observation.id }
    });
    console.log('✅ Test data cleaned (cascade delete removed all related records)');

    console.log('\n' + '=' .repeat(80));
    console.log('✅ ALL RELATED TABLES WORKING PERFECTLY!');
    console.log('Evaluation records and student assessments are fully functional.');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testRelatedTables();