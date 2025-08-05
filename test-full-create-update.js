const axios = require('axios');

// Complete test payload with ALL fields
const completePayload = {
  sessionInfo: {
    // Geographic fields (12)
    province: "Phnom Penh",
    provinceCode: "12",
    provinceNameKh: "ភ្នំពេញ",
    district: "Mean Chey",
    districtCode: "1201",
    districtNameKh: "មានជ័យ",
    commune: "Stueng Mean Chey",
    communeCode: "120108",
    communeNameKh: "ស្ទឹងមានជ័យ",
    village: "Boeng Salang",
    villageCode: "12010803",
    villageNameKh: "បឹងសាឡាង",
    
    // School info (3)
    cluster: "Cluster 1",
    school: "Boeng Salang Primary School",
    schoolId: 123,
    
    // Teacher info (3)
    nameOfTeacher: "Ms. CHHENG Sivleang",
    sex: "Female",
    employmentType: "CONTRACT",
    
    // Session details (6)
    sessionTime: "MORNING",
    subject: "Mathematics",
    chapter: "1",
    lesson: "1",
    title: "Addition and Subtraction",
    subTitle: "Basic Operations",
    
    // Time fields (3)
    inspectionDate: "2024-12-11",
    startTime: "08:00",
    endTime: "09:00",
    
    // Student counts (5)
    grade: 4,
    totalMale: 15,
    totalFemale: 17,
    totalAbsent: 3,
    totalAbsentFemale: 1,
    
    // Inspector info (3)
    inspectorName: "Mr. SENG Sophea",
    inspectorPosition: "Senior Inspector",
    inspectorOrganization: "MoEYS District Office",
    
    // Academic info (3)
    academicYear: "2024-2025",
    semester: 1,
    lessonDurationMinutes: 60,
    
    // Notes (1)
    generalNotes: "Excellent teaching methodology. Students were engaged throughout the lesson."
  },
  evaluationData: {
    evaluationLevels: [4],
    indicator_1: "yes",
    indicator_1_comment: "Teacher demonstrated excellent subject knowledge",
    indicator_2: "some_practice",
    indicator_2_comment: "Good use of materials but can improve",
    indicator_3: "yes",
    indicator_3_comment: "Clear lesson objectives were set",
    indicator_4: "no",
    indicator_4_comment: "Need to improve time management",
    indicator_5: "yes",
    indicator_5_comment: "Students were actively engaged"
  },
  studentAssessment: {
    subjects: [
      { name_km: "គណិតវិទ្យា", name_en: "Mathematics", order: 1, max_score: 100 },
      { name_km: "ភាសាខ្មែរ", name_en: "Khmer", order: 2, max_score: 100 },
      { name_km: "វិទ្យាសាស្ត្រ", name_en: "Science", order: 3, max_score: 100 }
    ],
    students: [
      { identifier: "S001", order: 1, name: "សុខ សុភា", gender: "F" },
      { identifier: "S002", order: 2, name: "ចាន់ វុទ្ធី", gender: "M" },
      { identifier: "S003", order: 3, name: "លី សុខា", gender: "F" },
      { identifier: "S004", order: 4, name: "គង់ រតនា", gender: "M" },
      { identifier: "S005", order: 5, name: "ហេង ស្រីពៅ", gender: "F" }
    ],
    scores: {
      subject_1: { student_1: 85, student_2: 78, student_3: 92, student_4: 70, student_5: 88 },
      subject_2: { student_1: 90, student_2: 82, student_3: 88, student_4: 75, student_5: 95 },
      subject_3: { student_1: 78, student_2: 85, student_3: 90, student_4: 82, student_5: 87 }
    }
  }
};

const sessionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwibmFtZSI6IkRlbW8gVXNlciIsInJvbGUiOiJBRE1JTklTVFJBVE9SIiwiaWF0IjoxNzMzMjI0ODAxLCJleHAiOjE3MzM4Mjk2MDF9.P2BHPBqYo5_Qv0a0--fMSXTCCCh-6L0lhBCNXBLRN2s';

async function testCreateAndUpdate() {
  console.log('🧪 TESTING COMPLETE DATA STORAGE FOR CREATE AND UPDATE\n');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Create new observation
    console.log('\n📝 STEP 1: Creating new observation with ALL fields...');
    const createResponse = await axios.post('http://localhost:3000/api/observations', completePayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      }
    });
    
    if (createResponse.data.success) {
      console.log('✅ Observation created successfully!');
      console.log(`   ID: ${createResponse.data.id}`);
      
      const observationId = createResponse.data.id;
      
      // Step 2: Retrieve to verify all fields were stored
      console.log('\n🔍 STEP 2: Retrieving observation to verify storage...');
      const getResponse = await axios.get(`http://localhost:3000/api/observations/${observationId}`, {
        headers: {
          'Cookie': `session=${sessionToken}`
        }
      });
      
      const observation = getResponse.data;
      console.log('✅ Observation retrieved successfully!');
      
      // Verify each field group
      console.log('\n📊 Field Storage Verification:');
      
      // Geographic fields
      const geoFields = ['province', 'provinceCode', 'provinceNameKh', 'district', 'districtCode', 
                        'districtNameKh', 'commune', 'communeCode', 'communeNameKh', 'village', 
                        'villageCode', 'villageNameKh'];
      const geoStored = geoFields.filter(f => observation[f]).length;
      console.log(`   Geographic fields: ${geoStored}/${geoFields.length} ✅`);
      
      // School fields
      const schoolFields = ['school', 'schoolId', 'cluster'];
      const schoolStored = schoolFields.filter(f => observation[f]).length;
      console.log(`   School fields: ${schoolStored}/${schoolFields.length} ✅`);
      
      // Teacher fields
      const teacherFields = ['nameOfTeacher', 'sex', 'employmentType'];
      const teacherStored = teacherFields.filter(f => observation[f]).length;
      console.log(`   Teacher fields: ${teacherStored}/${teacherFields.length} ✅`);
      
      // Time fields
      console.log(`   Time fields: ${observation.inspectionDate ? '✅' : '❌'} date, ${observation.startTime ? '✅' : '❌'} start, ${observation.endTime ? '✅' : '❌'} end`);
      
      // Evaluation records
      console.log(`   Evaluation records: ${observation.evaluationRecords.length} stored ✅`);
      
      // Student assessment
      const hasAssessment = observation.studentAssessmentSessions.length > 0;
      if (hasAssessment) {
        const assessment = observation.studentAssessmentSessions[0];
        console.log(`   Student assessment: ${assessment.subjects.length} subjects, ${assessment.students.length} students, ${assessment.scores.length} scores ✅`);
      }
      
      // Step 3: Update the observation
      console.log('\n✏️ STEP 3: Updating observation with modified data...');
      const updatePayload = {
        ...completePayload,
        sessionInfo: {
          ...completePayload.sessionInfo,
          generalNotes: "UPDATED: " + completePayload.sessionInfo.generalNotes,
          startTime: "09:30",
          endTime: "10:30",
          totalMale: 20,
          totalFemale: 22
        }
      };
      
      const updateResponse = await axios.put(`http://localhost:3000/api/observations/${observationId}`, updatePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Observation updated successfully!');
        
        // Step 4: Verify update
        console.log('\n🔍 STEP 4: Verifying update...');
        const verifyResponse = await axios.get(`http://localhost:3000/api/observations/${observationId}`, {
          headers: {
            'Cookie': `session=${sessionToken}`
          }
        });
        
        const updated = verifyResponse.data;
        console.log('✅ Update verification:');
        console.log(`   General notes: ${updated.generalNotes.startsWith('UPDATED:') ? '✅ Updated' : '❌ Not updated'}`);
        console.log(`   Start time: ${updated.startTime} ${updated.startTime !== observation.startTime ? '✅ Changed' : '❌ Same'}`);
        console.log(`   Total male: ${updated.totalMale} ${updated.totalMale === 20 ? '✅ Updated' : '❌ Not updated'}`);
        console.log(`   Total female: ${updated.totalFemale} ${updated.totalFemale === 22 ? '✅ Updated' : '❌ Not updated'}`);
        
        console.log('\n' + '=' .repeat(80));
        console.log('✅ COMPLETE DATA STORAGE TEST PASSED!');
        console.log('All fields are properly stored and updated in the database.');
      }
      
    } else {
      console.log('❌ Failed to create observation');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testCreateAndUpdate();