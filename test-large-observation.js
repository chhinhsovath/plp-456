const fetch = require('node-fetch');

// Large observation data from user
const largeObservationData = {
  "sessionInfo": {
    "sex": "M",
    "grade": 3,
    "title": "12",
    "lesson": "12",
    "school": "សាលាបឋមសិក្សាកំពង់តាឡុង",
    "chapter": "12",
    "commune": "Trapeang Chour",
    "endTime": "18:53",
    "subject": "គណិតវិទ្យា",
    "village": "Chheu Tealchhum",
    "district": "Aoral",
    "province": "Kampong Speu",
    "schoolId": 25,
    "semester": 1,
    "subTitle": "12",
    "startTime": "14:48",
    "totalMale": 12,
    "communeCode": "50403",
    "sessionTime": "morning",
    "totalAbsent": 1,
    "totalFemale": 12,
    "villageCode": "5040312",
    "academicYear": "2025",
    "districtCode": "504",
    "generalNotes": "DSF",
    "provinceCode": "5",
    "communeNameKh": "ត្រពាំងជោ",
    "nameOfTeacher": "12",
    "villageNameKh": "ឈើទាលជ្រុំ",
    "districtNameKh": "ឱរ៉ាល់",
    "employmentType": "official",
    "inspectionDate": "2025-08-09",
    "provinceNameKh": "កំពង់ស្ពឺ",
    "evaluationLevels": [1, 2, 3],
    "totalAbsentFemale": 2,
    "lessonDurationMinutes": 45,
    "cluster": "12",
    "inspectorName": "12",
    "inspectorPosition": "12",
    "inspectorOrganization": "12"
  },
  "evaluationData": {
    "indicator_1": "yes",
    "indicator_2": "some_practice",
    "indicator_3": "some_practice",
    "indicator_4": "yes",
    "indicator_5": "no",
    "indicator_6": "no",
    "indicator_7": "no",
    "indicator_8": "yes",
    "indicator_9": "yes",
    "indicator_10": "yes",
    "indicator_11": "some_practice",
    "indicator_12": "no",
    "indicator_13": "some_practice",
    "indicator_15": "yes",
    "indicator_14": "yes",
    "indicator_16": "yes",
    "indicator_17": "yes",
    "indicator_20": "yes",
    "indicator_19": "yes",
    "indicator_21": "yes",
    "indicator_22": "yes",
    "indicator_18": "some_practice",
    "evaluationLevels": [1, 2, 3],
    "indicator_1_comment": "Ipsum neque quis es",
    "indicator_2_comment": "Itaque corporis volu",
    "indicator_3_comment": "Omnis voluptatem Fu",
    "indicator_4_comment": "Illum autem et nisi",
    "indicator_5_comment": "Ut velit consectetur",
    "indicator_6_comment": "Ut et est nulla hic ",
    "indicator_7_comment": "Fuga Aut voluptas q",
    "indicator_8_comment": "Esse autem aut aut n",
    "indicator_9_comment": "Maxime maiores eveni",
    "indicator_10_comment": "Aut dolores ut est q",
    "indicator_11_comment": "Culpa sit provident",
    "indicator_12_comment": "Harum exercitationem",
    "indicator_13_comment": "Earum commodi provid",
    "indicator_16_comment": "asf",
    "indicator_17_comment": "SDAFF",
    "indicator_15_comment": "ASDFF",
    "indicator_14_comment": "SADF",
    "indicator_20_comment": "ASDF",
    "indicator_19_comment": "SADFF",
    "indicator_21_comment": "ASFD",
    "indicator_22_comment": "ADSF"
  },
  "studentAssessment": {
    "subjects": [
      {"id": "1", "name_km": "អំណាន", "name_en": "Reading", "order": 1, "max_score": 100},
      {"id": "2", "name_km": "សរសេរ", "name_en": "Writing", "order": 2, "max_score": 100},
      {"id": "3", "name_km": "គណិតវិទ្យា", "name_en": "Mathematics", "order": 3, "max_score": 100}
    ],
    "students": [
      {"id": "1", "identifier": "សិស្សទី1", "order": 1, "name": "", "gender": "M"},
      {"id": "2", "identifier": "សិស្សទី2", "order": 2, "name": "", "gender": "F"},
      {"id": "3", "identifier": "សិស្សទី3", "order": 3, "name": "", "gender": "M"},
      {"id": "4", "identifier": "សិស្សទី4", "order": 4, "name": "", "gender": "F"},
      {"id": "5", "identifier": "សិស្សទី5", "order": 5, "name": "", "gender": "M"}
    ],
    "scores": {
      "subject_1": {"student_1": 92, "student_2": 57, "student_3": 37, "student_4": 52, "student_5": 19},
      "subject_2": {"student_1": 60, "student_2": 78, "student_3": 18, "student_4": 24, "student_5": 3},
      "subject_3": {"student_1": 21, "student_2": 45, "student_3": 93, "student_4": 47, "student_5": 23}
    }
  }
};

async function testLargeObservation() {
  console.log('Testing large observation creation (22 indicators)...\n');
  
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
    
    // Create observation with large dataset
    console.log('Creating observation with 22 indicators...');
    console.time('CreateObservation');
    
    const createResponse = await fetch('http://localhost:3000/api/observations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(largeObservationData)
    });
    
    console.timeEnd('CreateObservation');
    
    const createResult = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('Failed to create observation:', createResult);
      console.error('Error code:', createResult.code);
      console.error('Error details:', createResult.details);
      return;
    }
    
    console.log('✅ Large observation created successfully!');
    console.log('Observation ID:', createResult.id);
    console.log('Message:', createResult.message);
    
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
    console.log('Evaluation Records Count:', observation.evaluationRecords?.length || 0);
    console.log('Student Assessment Sessions:', observation.studentAssessmentSessions?.length || 0);
    
    // Verify all indicators were saved
    const expectedIndicators = 22;
    const actualIndicators = observation.evaluationRecords?.length || 0;
    
    if (actualIndicators === expectedIndicators) {
      console.log(`✅ All ${expectedIndicators} indicators saved correctly!`);
    } else {
      console.log(`⚠️ Expected ${expectedIndicators} indicators but found ${actualIndicators}`);
    }
    
    console.log('\n🎉 Large observation test completed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testLargeObservation();