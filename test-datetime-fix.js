const axios = require('axios');

async function testDateTimeFix() {
  const observationId = '1b8a1b2d-2237-47db-83f7-9b8c966253bf';
  const apiUrl = `http://localhost:3001/api/observations/${observationId}`;
  
  // Test payload with time fields as HH:MM strings
  const testPayload = {
    sessionInfo: {
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
      cluster: "Cluster 1",
      school: "Boeng Salang Primary School",
      schoolId: 123,
      nameOfTeacher: "Ms. CHHENG Sivleang",
      sex: "Female",
      employmentType: "CONTRACT",
      sessionTime: "MORNING",
      subject: "Mathematics",
      chapter: "1",
      lesson: "1",
      title: "Addition",
      subTitle: "Basic Addition",
      inspectionDate: "2024-12-11",
      startTime: "11:11",  // Test HH:MM format
      endTime: "12:11",    // Test HH:MM format
      grade: 4,
      totalMale: 15,
      totalFemale: 17,
      totalAbsent: 3,
      totalAbsentFemale: 1,
      inspectorName: "Mr. Inspector",
      inspectorPosition: "Senior Inspector",
      inspectorOrganization: "MoEYS",
      academicYear: "2024-2025",
      semester: 1,
      lessonDurationMinutes: 60,
      generalNotes: "Test observation update with DateTime fix"
    }
  };

  try {
    console.log('Testing observation update with DateTime fix...');
    console.log('Start time:', testPayload.sessionInfo.startTime);
    console.log('End time:', testPayload.sessionInfo.endTime);
    
    const response = await axios.put(apiUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwibmFtZSI6IkRlbW8gVXNlciIsInJvbGUiOiJBRE1JTklTVFJBVE9SIiwiaWF0IjoxNzMzMjI0ODAxLCJleHAiOjE3MzM4Mjk2MDF9.P2BHPBqYo5_Qv0a0--fMSXTCCCh-6L0lhBCNXBLRN2s'
      }
    });
    
    console.log('\n✅ Success! Observation updated');
    console.log('Response status:', response.status);
    console.log('Response message:', response.data.message);
    
    // Verify the times were saved correctly by fetching the observation
    const getResponse = await axios.get(apiUrl, {
      headers: {
        'Cookie': 'session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwibmFtZSI6IkRlbW8gVXNlciIsInJvbGUiOiJBRE1JTklTVFJBVE9SIiwiaWF0IjoxNzMzMjI0ODAxLCJleHAiOjE3MzM4Mjk2MDF9.P2BHPBqYo5_Qv0a0--fMSXTCCCh-6L0lhBCNXBLRN2s'
      }
    });
    
    console.log('\nVerifying saved times:');
    console.log('Start time from DB:', getResponse.data.startTime);
    console.log('End time from DB:', getResponse.data.endTime);
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testDateTimeFix();