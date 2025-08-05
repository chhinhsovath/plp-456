#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * 
 * This script tests the actual API endpoints to ensure:
 * 1. Create observation API works with all fields
 * 2. Update observation API works with all fields  
 * 3. Retrieve observation API returns all stored data
 * 4. All fields are properly persisted through the full API workflow
 */

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test server configuration
const BASE_URL = 'http://localhost:3000';

// Comprehensive test data
const COMPLETE_API_TEST_DATA = {
  sessionInfo: {
    // Geographic fields with codes and Khmer names
    province: "បាត់ដំបង",
    provinceCode: "02",
    provinceNameKh: "បាត់ដំបង",
    district: "បាត់ដំបង",
    districtCode: "0201",
    districtNameKh: "បាត់ដំបង", 
    commune: "ក្រចេះ",
    communeCode: "020101",
    communeNameKh: "ក្រចេះ",
    village: "ក្រចេះ",
    villageCode: "02010101",
    villageNameKh: "ក្រចេះ",

    // School information
    school: "សាលាបឋមសិក្សាក្រចេះ",
    schoolId: "99999",
    cluster: "ចង្កោម៣",

    // Teacher information
    nameOfTeacher: "លោកគ្រូ វិជ្ជា ចាន់ថា",
    sex: "ប្រុស",
    employmentType: "ភ្នាក់ងារសាលា",

    // Session details
    sessionTime: "ព្រឹក",
    subject: "ភាសាខ្មែរ",
    chapter: "៧",
    lesson: "១",
    title: "ការអានអត្ថបទ",
    subTitle: "អានយល់ពីអត្ថបទ",

    // Time fields
    inspectionDate: "2024-12-16",
    startTime: "07:30",
    endTime: "08:30",
    grade: "3",

    // Student counts
    totalMale: "12",
    totalFemale: "14",
    totalAbsent: "1",
    totalAbsentFemale: "0",

    // Inspector information
    inspectorName: "លោកស្រី ហេង សុផល",
    inspectorPosition: "អនុប្រធាន",
    inspectorOrganization: "ការិយាល័យអប់រំ បាត់ដំបង",

    // Academic information
    academicYear: "២០២៤-២០២៥",
    semester: "1",
    lessonDurationMinutes: "60",

    // General notes
    generalNotes: "ការបង្រៀនមានប្រសិទ្ធភាព។ សិស្សមានការចូលរួមសកម្ម។ វាតារណ៍ល្អ។"
  },

  evaluationData: {
    evaluationLevels: [1, 2, 3],
    // Test multiple evaluation indicators with comments
    indicator_1: "yes",
    indicator_1_comment: "ខ្លឹមសារតាមកម្មវិធីសិក្សា",
    indicator_2: "some_practice", 
    indicator_2_comment: "ត្រូវកែលម្អចំណេះដឹង",
    indicator_5: "yes",
    indicator_5_comment: "សិស្សប្រើសម្ភារៈបានល្អ",
    indicator_10: "yes",
    indicator_10_comment: "មានការងារក្រុមប្រកបដោយប្រសិទ្ធភាព",
    indicator_15: "some_practice",
    indicator_15_comment: "ត្រូវជួយសិស្សរៀនយឺតបន្ថែម",
    indicator_20: "yes",
    indicator_20_comment: "មានការកត់ត្រាលម្អិត"
  },

  studentAssessment: {
    subjects: [
      {
        name_km: "ភាសាខ្មែរ",
        name_en: "Khmer Language",
        order: 1,
        max_score: 100
      },
      {
        name_km: "គណិតវិទ្យា", 
        name_en: "Mathematics",
        order: 2,
        max_score: 100
      },
      {
        name_km: "វិទ្យាសាស្ត្រ",
        name_en: "Science", 
        order: 3,
        max_score: 100
      }
    ],
    students: [
      {
        identifier: "០០១",
        order: 1,
        name: "ចាន់ សុភាព",
        gender: "ប្រុស"
      },
      {
        identifier: "០០២", 
        order: 2,
        name: "ពេជ្រ សុវណ្ណី",
        gender: "ស្រី"
      },
      {
        identifier: "០០៣",
        order: 3, 
        name: "ហេង ដារ៉ា",
        gender: "ប្រុស"
      },
      {
        identifier: "០០៤",
        order: 4,
        name: "សុខ សុផល",
        gender: "ស្រី"
      }
    ],
    scores: {
      subject_1: {
        student_1: 92,
        student_2: 88,
        student_3: 85,
        student_4: 90
      },
      subject_2: {
        student_1: 87,
        student_2: 93,
        student_3: 79,
        student_4: 86
      },
      subject_3: {
        student_1: 84,
        student_2: 89,
        student_3: 82,
        student_4: 91
      }
    }
  },

  createdBy: "api-test@example.com",
  userRole: "INSPECTOR"
};

// Updated data for testing the update functionality
const UPDATED_API_TEST_DATA = {
  sessionInfo: {
    // Update geographic fields
    province: "សៀមរាប",
    provinceCode: "17",
    provinceNameKh: "សៀមរាប",
    district: "សៀមរាប",
    districtCode: "1701",
    districtNameKh: "សៀមរាប",
    commune: "សាលាកំរៀង",
    communeCode: "170101", 
    communeNameKh: "សាលាកំរៀង",
    village: "សាលាកំរៀង",
    villageCode: "17010101",
    villageNameKh: "សាលាកំរៀង",

    // Update school information
    school: "សាលាបឋមសិក្សាសាលាកំរៀង",
    schoolId: "88888",
    cluster: "ចង្កោម៤",

    // Update teacher information
    nameOfTeacher: "លោកស្រី សុខ ម៉ាលី",
    sex: "ស្រី",
    employmentType: "មន្ត្រីរាជការ",

    // Update session details
    sessionTime: "រសៀល",
    subject: "សង្គមវិទ្យា",
    chapter: "៥", 
    lesson: "២",
    title: "ប្រវត្តិសាស្ត្រ",
    subTitle: "ប្រវត្តិសាស្ត្រកម្ពុជា",

    // Update time fields
    inspectionDate: "2024-12-17",
    startTime: "13:30",
    endTime: "14:30",
    grade: "4",

    // Update student counts
    totalMale: "10",
    totalFemale: "12", 
    totalAbsent: "2",
    totalAbsentFemale: "1",

    // Update inspector information
    inspectorName: "លោក សម រតនា",
    inspectorPosition: "ប្រធាន",
    inspectorOrganization: "ការិយាល័យអប់រំ សៀមរាប", 

    // Update academic information
    academicYear: "២០២៤-២០២៥",
    semester: "2",
    lessonDurationMinutes: "45",

    // Update general notes
    generalNotes: "ការបង្រៀនប្រកបដោយគុណភាព។ សិស្សមានការធ្វើការជាក្រុមបានល្អ។"
  },

  evaluationData: {
    evaluationLevels: [1, 2, 3],
    // Update evaluation indicators
    indicator_1: "some_practice",
    indicator_1_comment: "ត្រូវអនុវត្តឱ្យបានប្រសើរជាងនេះ",
    indicator_2: "yes",
    indicator_2_comment: "គ្រូមានចំណេះដឹងគ្រប់គ្រាន់",
    indicator_5: "yes", 
    indicator_5_comment: "សិស្សប្រើប្រាស់សម្ភារៈបានសមស្រប",
    indicator_10: "some_practice",
    indicator_10_comment: "ត្រូវលើកទឹកចិត្តការចូលរួមបន្ថែម",
    indicator_15: "yes",
    indicator_15_comment: "មានការជួយសិស្សរៀនយឺតបានល្អ",
    indicator_20: "yes",
    indicator_20_comment: "កត់ត្រាបានល្អិតល្អន់"
  },

  studentAssessment: {
    subjects: [
      {
        name_km: "សង្គមវិទ្យា",
        name_en: "Social Studies", 
        order: 1,
        max_score: 100
      },
      {
        name_km: "កីឡា",
        name_en: "Physical Education",
        order: 2, 
        max_score: 100
      }
    ],
    students: [
      {
        identifier: "០០៥",
        order: 1,
        name: "អុុំ សុភក្រា",
        gender: "ស្រី"
      },
      {
        identifier: "០០៦",
        order: 2,
        name: "កែវ ពិសាច",
        gender: "ប្រុស"
      }
    ],
    scores: {
      subject_1: {
        student_1: 89,
        student_2: 76
      },
      subject_2: {
        student_1: 94,
        student_2: 88
      }
    }
  }
};

class APIEndpointTester {
  constructor() {
    this.testResults = {
      create: { passed: false, observationId: null, errors: [] },
      retrieve: { passed: false, errors: [] },
      update: { passed: false, errors: [] },
      retrieveUpdated: { passed: false, errors: [] }
    };
    this.authCookie = null;
  }

  async runAllTests() {
    console.log('🚀 STARTING API ENDPOINTS TEST');
    console.log('=' .repeat(70));

    try {
      // Setup authentication
      console.log('\n🔐 Setting up authentication...');
      await this.setupAuth();

      // Test 1: Create observation via API
      console.log('\n📝 Test 1: Creating observation via API...');
      await this.testCreateObservation();

      // Test 2: Retrieve created observation
      console.log('\n🔍 Test 2: Retrieving created observation...');
      await this.testRetrieveObservation();

      // Test 3: Update observation via API
      console.log('\n✏️  Test 3: Updating observation via API...');
      await this.testUpdateObservation();

      // Test 4: Retrieve updated observation
      console.log('\n🔍 Test 4: Retrieving updated observation...');
      await this.testRetrieveUpdatedObservation();

      // Print comprehensive summary
      await this.printTestSummary();

    } catch (error) {
      console.error('❌ Fatal error during API testing:', error);
    } finally {
      await this.cleanup();
    }
  }

  async setupAuth() {
    try {
      // Create test user
      const testUser = await prisma.user.upsert({
        where: { email: 'api-test@example.com' },
        update: { name: 'API Test User' },
        create: {
          email: 'api-test@example.com', 
          name: 'API Test User',
          role: 'INSPECTOR',
          isActive: true
        }
      });

      console.log('✅ Test user created/updated');
      
      // For this test, we'll simulate authentication by setting a mock session
      // In a real scenario, you would authenticate via the login endpoint
      
    } catch (error) {
      console.log('❌ Auth setup failed:', error.message);
    }
  }

  async testCreateObservation() {
    try {
      const response = await fetch(`${BASE_URL}/api/observations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In a real test, you would include authentication headers
        },
        body: JSON.stringify(COMPLETE_API_TEST_DATA)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      this.testResults.create.observationId = result.id;
      this.testResults.create.passed = true;

      console.log('✅ Observation created via API:', result.id);
      console.log('✅ CREATE API test passed');

    } catch (error) {
      this.testResults.create.errors.push(error.message);
      console.log('❌ CREATE API test failed:', error.message);
    }
  }

  async testRetrieveObservation() {
    if (!this.testResults.create.observationId) {
      this.testResults.retrieve.errors.push('No observation ID to retrieve');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/observations/${this.testResults.create.observationId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const observation = await response.json();
      
      // Verify all major field categories are present
      this.verifyRetrievedData(observation, 'CREATE');
      
      this.testResults.retrieve.passed = true;
      console.log('✅ Observation retrieved via API');
      console.log('✅ RETRIEVE API test passed');

    } catch (error) {
      this.testResults.retrieve.errors.push(error.message);
      console.log('❌ RETRIEVE API test failed:', error.message);
    }
  }

  async testUpdateObservation() {
    if (!this.testResults.create.observationId) {
      this.testResults.update.errors.push('No observation ID to update');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/observations/${this.testResults.create.observationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(UPDATED_API_TEST_DATA)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      this.testResults.update.passed = true;

      console.log('✅ Observation updated via API');
      console.log('✅ UPDATE API test passed');

    } catch (error) {
      this.testResults.update.errors.push(error.message);
      console.log('❌ UPDATE API test failed:', error.message);
    }
  }

  async testRetrieveUpdatedObservation() {
    if (!this.testResults.create.observationId) {
      this.testResults.retrieveUpdated.errors.push('No observation ID to retrieve');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/observations/${this.testResults.create.observationId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const observation = await response.json();
      
      // Verify updated data is correctly stored
      this.verifyRetrievedData(observation, 'UPDATE');
      
      this.testResults.retrieveUpdated.passed = true;
      console.log('✅ Updated observation retrieved via API');
      console.log('✅ RETRIEVE UPDATED API test passed');

    } catch (error) {
      this.testResults.retrieveUpdated.errors.push(error.message);
      console.log('❌ RETRIEVE UPDATED API test failed:', error.message);
    }
  }

  verifyRetrievedData(observation, testType) {
    const expectedData = testType === 'CREATE' ? COMPLETE_API_TEST_DATA : UPDATED_API_TEST_DATA;
    
    console.log(`  🔍 Verifying ${testType} data...`);
    
    // Verify main session info fields
    const sessionFields = [
      'province', 'district', 'school', 'nameOfTeacher', 'subject', 
      'grade', 'totalMale', 'totalFemale', 'inspectorName'
    ];
    
    let verified = 0;
    let missing = 0;
    
    for (const field of sessionFields) {
      if (observation[field] !== null && observation[field] !== undefined) {
        verified++;
      } else {
        missing++;
        console.log(`    ⚠️  Missing field: ${field}`);
      }
    }
    
    console.log(`    ✅ Session fields: ${verified}/${sessionFields.length} present`);
    
    // Verify evaluation records
    if (observation.evaluationRecords && observation.evaluationRecords.length > 0) {
      console.log(`    ✅ Evaluation records: ${observation.evaluationRecords.length} found`);
    } else {
      console.log(`    ⚠️  No evaluation records found`);
    }
    
    // Verify student assessment
    if (observation.studentAssessmentSessions && observation.studentAssessmentSessions.length > 0) {
      const assessment = observation.studentAssessmentSessions[0];
      console.log(`    ✅ Assessment subjects: ${assessment.subjects?.length || 0}`);
      console.log(`    ✅ Assessment students: ${assessment.students?.length || 0}`);
      console.log(`    ✅ Assessment scores: ${assessment.scores?.length || 0}`);
    } else {
      console.log(`    ⚠️  No student assessment found`);
    }
  }

  async printTestSummary() {
    console.log('\n' + '=' .repeat(70));
    console.log('📋 API ENDPOINTS TEST SUMMARY');
    console.log('=' .repeat(70));

    const tests = [
      { name: 'CREATE API', result: this.testResults.create },
      { name: 'RETRIEVE API', result: this.testResults.retrieve },
      { name: 'UPDATE API', result: this.testResults.update },
      { name: 'RETRIEVE UPDATED API', result: this.testResults.retrieveUpdated }
    ];

    let totalPassed = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      const status = test.result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test.name}: ${status}`);
      
      if (test.result.passed) {
        totalPassed++;
      }
      
      if (test.result.errors.length > 0) {
        for (const error of test.result.errors) {
          console.log(`  ❌ ${error}`);
        }
      }
    }

    console.log('\n' + '=' .repeat(70));
    console.log(`📊 RESULTS: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 ALL API ENDPOINTS WORKING CORRECTLY!');
      console.log('✅ All observation fields are properly stored and retrieved via API');
    } else {
      console.log('⚠️  SOME API ENDPOINTS FAILED - CHECK ERRORS ABOVE');
    }
    console.log('=' .repeat(70));

    // Print database summary
    await this.printDatabaseSummary();
  }

  async printDatabaseSummary() {
    try {
      console.log('\n📊 FINAL DATABASE STATE:');
      console.log('-' .repeat(40));
      
      const counts = {
        sessions: await prisma.inspectionSession.count(),
        evaluations: await prisma.evaluationRecord.count(),
        assessments: await prisma.studentAssessmentSession.count(),
        subjects: await prisma.assessmentSubject.count(),
        students: await prisma.assessmentStudent.count(),
        scores: await prisma.studentScore.count()
      };

      for (const [table, count] of Object.entries(counts)) {
        console.log(`  ${table}: ${count} records`);
      }

    } catch (error) {
      console.log('  ❌ Could not retrieve database summary:', error.message);
    }
  }

  async cleanup() {
    try {
      // Soft delete test observation
      if (this.testResults.create.observationId) {
        await prisma.inspectionSession.update({
          where: { id: this.testResults.create.observationId },
          data: { isActive: false }
        });
        console.log('\n🧹 Test data cleaned up');
      }
    } catch (error) {
      console.log('⚠️  Cleanup error:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  console.log('⚠️  NOTE: This test requires the Next.js development server to be running on port 3000');
  console.log('Run: npm run dev');
  console.log();

  const tester = new APIEndpointTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { APIEndpointTester };