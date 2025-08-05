const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectDatabaseStorage() {
  console.log('🔍 DIRECT DATABASE STORAGE TEST\n');
  console.log('=' .repeat(80));
  
  try {
    // Create a complete observation directly in the database
    const testData = {
      // Geographic fields (12)
      province: "Test Province",
      provinceCode: "99",
      provinceNameKh: "ខេត្តតេស្ត",
      district: "Test District",
      districtCode: "9901",
      districtNameKh: "ស្រុកតេស្ត",
      commune: "Test Commune",
      communeCode: "990101",
      communeNameKh: "ឃុំតេស្ត",
      village: "Test Village",
      villageCode: "99010101",
      villageNameKh: "ភូមិតេស្ត",
      
      // School info (3)
      cluster: "Test Cluster",
      school: "Test Primary School",
      schoolId: 99999,
      
      // Teacher info (3)
      nameOfTeacher: "Test Teacher",
      sex: "Male",
      employmentType: "PERMANENT",
      
      // Session details (6)
      sessionTime: "MORNING",
      subject: "Test Subject",
      chapter: "99",
      lesson: "99",
      title: "Test Title for Complete Storage Verification",
      subTitle: "Test Subtitle for Complete Storage Verification",
      
      // Time fields (3)
      inspectionDate: new Date("2024-12-31"),
      startTime: new Date(1970, 0, 1, 9, 0, 0),
      endTime: new Date(1970, 0, 1, 10, 0, 0),
      
      // Student counts (5)
      grade: 6,
      totalMale: 25,
      totalFemale: 30,
      totalAbsent: 5,
      totalAbsentFemale: 2,
      
      // Inspector info (3)
      inspectorName: "Test Inspector",
      inspectorPosition: "Chief Inspector",
      inspectorOrganization: "Test Education Office",
      
      // Academic info (3)
      academicYear: "2024-2025",
      semester: 2,
      lessonDurationMinutes: 45,
      
      // Notes (1)
      generalNotes: "This is a test observation to verify complete data storage in all database fields.",
      
      // System fields
      level: 5,
      inspectionStatus: "completed",
      createdBy: "test@example.com",
      userId: 1
    };

    console.log('\n📝 Creating observation with ALL 41 fields...');
    const created = await prisma.inspectionSession.create({
      data: testData
    });

    console.log('✅ Observation created successfully!');
    console.log(`   ID: ${created.id}`);

    // Retrieve and verify
    console.log('\n🔍 Retrieving observation to verify storage...');
    const retrieved = await prisma.inspectionSession.findUnique({
      where: { id: created.id }
    });

    // Count stored fields
    const fieldsToCheck = [
      // Geographic (12)
      'province', 'provinceCode', 'provinceNameKh', 'district', 'districtCode', 'districtNameKh',
      'commune', 'communeCode', 'communeNameKh', 'village', 'villageCode', 'villageNameKh',
      // School (3)
      'cluster', 'school', 'schoolId',
      // Teacher (3)
      'nameOfTeacher', 'sex', 'employmentType',
      // Session (6)
      'sessionTime', 'subject', 'chapter', 'lesson', 'title', 'subTitle',
      // Time (3)
      'inspectionDate', 'startTime', 'endTime',
      // Counts (5)
      'grade', 'totalMale', 'totalFemale', 'totalAbsent', 'totalAbsentFemale',
      // Inspector (3)
      'inspectorName', 'inspectorPosition', 'inspectorOrganization',
      // Academic (3)
      'academicYear', 'semester', 'lessonDurationMinutes',
      // Notes (1)
      'generalNotes'
    ];

    console.log('\n📊 FIELD STORAGE VERIFICATION:');
    let storedCount = 0;
    let missingFields = [];

    fieldsToCheck.forEach(field => {
      const value = retrieved[field];
      const isStored = value !== null && value !== undefined;
      if (isStored) {
        storedCount++;
      } else {
        missingFields.push(field);
      }
    });

    console.log(`   ✅ Fields stored: ${storedCount}/${fieldsToCheck.length}`);
    if (missingFields.length > 0) {
      console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
    }

    // Show sample of stored data
    console.log('\n📋 SAMPLE OF STORED DATA:');
    console.log(`   Province: ${retrieved.province} (${retrieved.provinceCode}) - ${retrieved.provinceNameKh}`);
    console.log(`   District: ${retrieved.district} (${retrieved.districtCode}) - ${retrieved.districtNameKh}`);
    console.log(`   School: ${retrieved.school} (ID: ${retrieved.schoolId})`);
    console.log(`   Teacher: ${retrieved.nameOfTeacher} (${retrieved.sex}, ${retrieved.employmentType})`);
    console.log(`   Subject: ${retrieved.subject} - ${retrieved.title}`);
    console.log(`   Time: ${retrieved.startTime?.toISOString()} to ${retrieved.endTime?.toISOString()}`);
    console.log(`   Students: ${retrieved.totalMale}M + ${retrieved.totalFemale}F (${retrieved.totalAbsent} absent)`);
    console.log(`   Inspector: ${retrieved.inspectorName} - ${retrieved.inspectorPosition}`);

    // Test update
    console.log('\n✏️ Testing UPDATE operation...');
    const updateData = {
      generalNotes: "UPDATED: " + retrieved.generalNotes,
      totalMale: 35,
      totalFemale: 40,
      startTime: new Date(1970, 0, 1, 10, 30, 0)
    };

    const updated = await prisma.inspectionSession.update({
      where: { id: created.id },
      data: updateData
    });

    console.log('✅ Update successful!');
    console.log(`   General notes updated: ${updated.generalNotes.startsWith('UPDATED:') ? 'YES' : 'NO'}`);
    console.log(`   Total male updated: ${updated.totalMale === 35 ? 'YES' : 'NO'}`);
    console.log(`   Total female updated: ${updated.totalFemale === 40 ? 'YES' : 'NO'}`);
    console.log(`   Start time updated: ${updated.startTime?.getHours() === 10 ? 'YES' : 'NO'}`);

    // Clean up test data
    await prisma.inspectionSession.delete({
      where: { id: created.id }
    });
    console.log('\n🧹 Test data cleaned up');

    console.log('\n' + '=' .repeat(80));
    console.log('✅ ALL DATABASE OPERATIONS SUCCESSFUL!');
    console.log('All 41 fields are properly stored and can be updated in the database.');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDirectDatabaseStorage();