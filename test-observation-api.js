const fetch = require('node-fetch');

// Test data for creating an observation
const testObservationData = {
  sessionInfo: {
    province: "Phnom Penh",
    provinceCode: "12",
    provinceNameKh: "ភ្នំពេញ",
    district: "Chamkar Mon",
    districtCode: "1201",
    districtNameKh: "ចំការមន",
    commune: "Tonle Bassac",
    communeCode: "120101",
    communeNameKh: "ទន្លេបាសាក់",
    village: "Village 1",
    villageCode: "12010101",
    villageNameKh: "ភូមិទី១",
    cluster: "Cluster A",
    school: "Test Elementary School",
    schoolId: 1,
    nameOfTeacher: "Test Teacher",
    sex: "Male",
    employmentType: "Official",
    sessionTime: "Morning",
    subject: "Mathematics",
    chapter: "3",
    lesson: "5",
    title: "Basic Arithmetic Operations",
    subTitle: "Addition and Subtraction",
    inspectionDate: new Date().toISOString(),
    startTime: "08:00",
    endTime: "09:30",
    grade: 4,
    totalMale: 15,
    totalFemale: 12,
    totalAbsent: 2,
    totalAbsentFemale: 1,
    inspectorName: "Test Inspector",
    inspectorPosition: "Senior Inspector",
    inspectorOrganization: "Ministry of Education",
    academicYear: "2024-2025",
    semester: 1,
    lessonDurationMinutes: 90,
    generalNotes: "Test observation for API verification"
  },
  evaluationData: {
    evaluationLevels: [3],
    indicator_1: "Yes",
    indicator_1_comment: "Good preparation",
    indicator_2: "Some Practice",
    indicator_3: "Yes",
    indicator_4: "Yes",
    indicator_5: "Some Practice"
  },
  studentAssessment: {
    subjects: [
      { name_km: "គណិតវិទ្យា", name_en: "Mathematics", order: 1, max_score: 100 },
      { name_km: "ភាសាខ្មែរ", name_en: "Khmer", order: 2, max_score: 100 }
    ],
    students: [
      { identifier: "S001", order: 1, name: "Student 1", gender: "M" },
      { identifier: "S002", order: 2, name: "Student 2", gender: "F" },
      { identifier: "S003", order: 3, name: "Student 3", gender: "M" }
    ],
    scores: {
      subject_1: {
        student_1: 85,
        student_2: 90,
        student_3: 75
      },
      subject_2: {
        student_1: 80,
        student_2: 88,
        student_3: 92
      }
    }
  }
};

async function testCreateObservation() {
  console.log('Testing observation creation API...\n');
  
  try {
    // First, get a valid session cookie
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'chhinhs@gmail.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    
    // Extract cookies from login response
    const cookies = loginResponse.headers.raw()['set-cookie'];
    const cookieString = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
    
    console.log('Successfully logged in as chhinhs@gmail.com\n');
    
    // Create observation
    console.log('Creating new observation...');
    const createResponse = await fetch('http://localhost:3000/api/observations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(testObservationData)
    });
    
    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('Failed to create observation:', createResult);
      return;
    }
    
    console.log('✅ Observation created successfully!');
    console.log('Observation ID:', createResult.id);
    console.log('Message:', createResult.message);
    
    // Test updating the observation
    console.log('\nTesting observation update...');
    const updateData = {
      sessionInfo: {
        ...testObservationData.sessionInfo,
        generalNotes: "Updated notes - API test successful"
      },
      evaluationData: {
        ...testObservationData.evaluationData,
        indicator_6: "Yes",
        indicator_6_comment: "Additional evaluation"
      }
    };
    
    const updateResponse = await fetch(`http://localhost:3000/api/observations/${createResult.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.error('Failed to update observation:', updateResult);
      return;
    }
    
    console.log('✅ Observation updated successfully!');
    console.log('Message:', updateResult.message);
    
    // Fetch the observation to verify
    console.log('\nFetching observation to verify...');
    const getResponse = await fetch(`http://localhost:3000/api/observations/${createResult.id}`, {
      headers: {
        'Cookie': cookieString
      }
    });
    
    const observation = await getResponse.json();
    
    if (!getResponse.ok) {
      console.error('Failed to fetch observation:', observation);
      return;
    }
    
    console.log('✅ Observation fetched successfully!');
    console.log('General Notes:', observation.generalNotes);
    console.log('Evaluation Records Count:', observation.evaluationRecords?.length || 0);
    console.log('Student Assessment Sessions:', observation.studentAssessmentSessions?.length || 0);
    
    console.log('\n🎉 All API tests passed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testCreateObservation();