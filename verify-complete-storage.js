const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCompleteStorage() {
  console.log('🔍 COMPLETE STORAGE VERIFICATION REPORT\n');
  console.log('=' .repeat(80));
  
  try {
    // Get the most recent observation
    const latestObservation = await prisma.inspectionSession.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        evaluationRecords: {
          include: { field: true }
        },
        studentAssessmentSessions: {
          include: {
            subjects: true,
            students: true,
            scores: true
          }
        }
      }
    });

    if (!latestObservation) {
      console.log('❌ No observations found in database');
      return;
    }

    console.log('📋 LATEST OBSERVATION DETAILS:');
    console.log(`ID: ${latestObservation.id}`);
    console.log(`Created: ${latestObservation.createdAt}`);
    console.log(`Updated: ${latestObservation.updatedAt}`);
    console.log('\n');

    // Verify Geographic Fields
    console.log('📍 GEOGRAPHIC FIELDS (12 fields):');
    const geoFields = [
      { field: 'province', value: latestObservation.province },
      { field: 'provinceCode', value: latestObservation.provinceCode },
      { field: 'provinceNameKh', value: latestObservation.provinceNameKh },
      { field: 'district', value: latestObservation.district },
      { field: 'districtCode', value: latestObservation.districtCode },
      { field: 'districtNameKh', value: latestObservation.districtNameKh },
      { field: 'commune', value: latestObservation.commune },
      { field: 'communeCode', value: latestObservation.communeCode },
      { field: 'communeNameKh', value: latestObservation.communeNameKh },
      { field: 'village', value: latestObservation.village },
      { field: 'villageCode', value: latestObservation.villageCode },
      { field: 'villageNameKh', value: latestObservation.villageNameKh }
    ];
    
    let geoStored = 0;
    geoFields.forEach(({ field, value }) => {
      const status = value ? '✅' : '❌';
      if (value) geoStored++;
      console.log(`  ${status} ${field}: ${value || 'NOT STORED'}`);
    });
    console.log(`  📊 Geographic Storage: ${geoStored}/12 fields stored\n`);

    // Verify School Information
    console.log('🏫 SCHOOL INFORMATION (3 fields):');
    const schoolFields = [
      { field: 'school', value: latestObservation.school },
      { field: 'schoolId', value: latestObservation.schoolId },
      { field: 'cluster', value: latestObservation.cluster }
    ];
    
    let schoolStored = 0;
    schoolFields.forEach(({ field, value }) => {
      const status = value ? '✅' : '❌';
      if (value) schoolStored++;
      console.log(`  ${status} ${field}: ${value || 'NOT STORED'}`);
    });
    console.log(`  📊 School Storage: ${schoolStored}/3 fields stored\n`);

    // Verify Teacher Information
    console.log('👩‍🏫 TEACHER INFORMATION (3 fields):');
    const teacherFields = [
      { field: 'nameOfTeacher', value: latestObservation.nameOfTeacher },
      { field: 'sex', value: latestObservation.sex },
      { field: 'employmentType', value: latestObservation.employmentType }
    ];
    
    let teacherStored = 0;
    teacherFields.forEach(({ field, value }) => {
      const status = value ? '✅' : '❌';
      if (value) teacherStored++;
      console.log(`  ${status} ${field}: ${value || 'NOT STORED'}`);
    });
    console.log(`  📊 Teacher Storage: ${teacherStored}/3 fields stored\n`);

    // Verify Session Details
    console.log('📚 SESSION DETAILS (6 fields):');
    const sessionFields = [
      { field: 'sessionTime', value: latestObservation.sessionTime },
      { field: 'subject', value: latestObservation.subject },
      { field: 'chapter', value: latestObservation.chapter },
      { field: 'lesson', value: latestObservation.lesson },
      { field: 'title', value: latestObservation.title },
      { field: 'subTitle', value: latestObservation.subTitle }
    ];
    
    let sessionStored = 0;
    sessionFields.forEach(({ field, value }) => {
      const status = value ? '✅' : '❌';
      if (value) sessionStored++;
      console.log(`  ${status} ${field}: ${value || 'NOT STORED'}`);
    });
    console.log(`  📊 Session Storage: ${sessionStored}/6 fields stored\n`);

    // Verify Time Fields
    console.log('⏰ TIME FIELDS (3 fields):');
    const timeFields = [
      { field: 'inspectionDate', value: latestObservation.inspectionDate },
      { field: 'startTime', value: latestObservation.startTime },
      { field: 'endTime', value: latestObservation.endTime }
    ];
    
    let timeStored = 0;
    timeFields.forEach(({ field, value }) => {
      const status = value ? '✅' : '❌';
      if (value) timeStored++;
      console.log(`  ${status} ${field}: ${value || 'NOT STORED'}`);
    });
    console.log(`  📊 Time Storage: ${timeStored}/3 fields stored\n`);

    // Verify Student Counts
    console.log('👥 STUDENT COUNTS (5 fields):');
    const countFields = [
      { field: 'grade', value: latestObservation.grade },
      { field: 'totalMale', value: latestObservation.totalMale },
      { field: 'totalFemale', value: latestObservation.totalFemale },
      { field: 'totalAbsent', value: latestObservation.totalAbsent },
      { field: 'totalAbsentFemale', value: latestObservation.totalAbsentFemale }
    ];
    
    let countStored = 0;
    countFields.forEach(({ field, value }) => {
      const status = value !== null && value !== undefined ? '✅' : '❌';
      if (value !== null && value !== undefined) countStored++;
      console.log(`  ${status} ${field}: ${value ?? 'NOT STORED'}`);
    });
    console.log(`  📊 Count Storage: ${countStored}/5 fields stored\n`);

    // Verify Inspector Information
    console.log('🔍 INSPECTOR INFORMATION (3 fields):');
    const inspectorFields = [
      { field: 'inspectorName', value: latestObservation.inspectorName },
      { field: 'inspectorPosition', value: latestObservation.inspectorPosition },
      { field: 'inspectorOrganization', value: latestObservation.inspectorOrganization }
    ];
    
    let inspectorStored = 0;
    inspectorFields.forEach(({ field, value }) => {
      const status = value ? '✅' : '❌';
      if (value) inspectorStored++;
      console.log(`  ${status} ${field}: ${value || 'NOT STORED'}`);
    });
    console.log(`  📊 Inspector Storage: ${inspectorStored}/3 fields stored\n`);

    // Verify Academic Information
    console.log('🎓 ACADEMIC INFORMATION (3 fields):');
    const academicFields = [
      { field: 'academicYear', value: latestObservation.academicYear },
      { field: 'semester', value: latestObservation.semester },
      { field: 'lessonDurationMinutes', value: latestObservation.lessonDurationMinutes }
    ];
    
    let academicStored = 0;
    academicFields.forEach(({ field, value }) => {
      const status = value !== null && value !== undefined ? '✅' : '❌';
      if (value !== null && value !== undefined) academicStored++;
      console.log(`  ${status} ${field}: ${value ?? 'NOT STORED'}`);
    });
    console.log(`  📊 Academic Storage: ${academicStored}/3 fields stored\n`);

    // Verify General Notes
    console.log('📝 GENERAL NOTES (1 field):');
    const notesStored = latestObservation.generalNotes ? 1 : 0;
    console.log(`  ${latestObservation.generalNotes ? '✅' : '❌'} generalNotes: ${latestObservation.generalNotes || 'NOT STORED'}`);
    console.log(`  📊 Notes Storage: ${notesStored}/1 fields stored\n`);

    // Verify Evaluation Data
    console.log('📊 EVALUATION DATA:');
    console.log(`  Total evaluation records: ${latestObservation.evaluationRecords.length}`);
    if (latestObservation.evaluationRecords.length > 0) {
      console.log('  Sample records:');
      latestObservation.evaluationRecords.slice(0, 3).forEach(record => {
        console.log(`    ✅ Indicator ${record.field.indicatorSequence}: ${record.scoreValue}${record.notes ? ` (Comment: ${record.notes})` : ''}`);
      });
    }
    console.log('');

    // Verify Student Assessment
    console.log('📝 STUDENT ASSESSMENT DATA:');
    if (latestObservation.studentAssessmentSessions.length > 0) {
      const assessment = latestObservation.studentAssessmentSessions[0];
      console.log(`  ✅ Assessment sessions: ${latestObservation.studentAssessmentSessions.length}`);
      console.log(`  ✅ Subjects: ${assessment.subjects.length}`);
      console.log(`  ✅ Students: ${assessment.students.length}`);
      console.log(`  ✅ Scores: ${assessment.scores.length}`);
    } else {
      console.log('  ❌ No student assessment data');
    }
    console.log('');

    // Calculate Overall Storage Rate
    console.log('=' .repeat(80));
    console.log('📊 OVERALL STORAGE SUMMARY:');
    const totalFields = 41; // Main observation fields
    const totalStored = geoStored + schoolStored + teacherStored + sessionStored + 
                       timeStored + countStored + inspectorStored + academicStored + notesStored;
    const storageRate = ((totalStored / totalFields) * 100).toFixed(1);
    
    console.log(`  Main fields stored: ${totalStored}/${totalFields} (${storageRate}%)`);
    console.log(`  Evaluation records: ${latestObservation.evaluationRecords.length}`);
    console.log(`  Student assessments: ${latestObservation.studentAssessmentSessions.length > 0 ? '✅' : '❌'}`);
    
    if (storageRate === '100.0') {
      console.log('\n✅ PERFECT! All observation fields are being stored correctly!');
    } else {
      console.log(`\n⚠️  Storage rate is ${storageRate}%. Some fields may not have been provided.`);
    }

    // Show SQL query to verify in database
    console.log('\n💾 VERIFY IN DATABASE WITH THIS QUERY:');
    console.log(`SELECT * FROM inspection_sessions WHERE id = '${latestObservation.id}';`);

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyCompleteStorage();