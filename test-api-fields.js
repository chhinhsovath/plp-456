const axios = require('axios');

async function testAPIFields() {
  console.log('🧪 TESTING API WITH SPECIFIC FIELDS\n');
  console.log('=' .repeat(80));
  
  const sessionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwibmFtZSI6IkRlbW8gVXNlciIsInJvbGUiOiJBRE1JTklTVFJBVE9SIiwiaWF0IjoxNzMzMjI0ODAxLCJleHAiOjE3MzM4Mjk2MDF9.P2BHPBqYo5_Qv0a0--fMSXTCCCh-6L0lhBCNXBLRN2s';
  
  // Minimal payload with focus on the three fields
  const payload = {
    sessionInfo: {
      // Required fields
      province: "Phnom Penh",
      district: "Mean Chey",
      commune: "Stueng Mean Chey",
      school: "Test School",
      nameOfTeacher: "Test Teacher",
      sex: "Male",
      employmentType: "PERMANENT",
      sessionTime: "MORNING",
      subject: "Mathematics",
      grade: 5,
      inspectionDate: "2024-12-31",
      
      // THE THREE FIELDS WE'RE TESTING
      cluster: "CLUSTER TEST VALUE - ចង្កោមទី៥",
      inspectorName: "Mr. API Test",
      inspectorPosition: "API TEST POSITION",
      inspectorOrganization: "API TEST ORGANIZATION"
    },
    evaluationData: {
      evaluationLevels: [3]
    }
  };

  try {
    // Create observation
    console.log('\n📝 Creating observation via API...');
    console.log('Sending values:');
    console.log(`  Cluster: "${payload.sessionInfo.cluster}"`);
    console.log(`  Position: "${payload.sessionInfo.inspectorPosition}"`);
    console.log(`  Organization: "${payload.sessionInfo.inspectorOrganization}"`);
    
    const createResponse = await axios.post('http://localhost:3000/api/observations', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${sessionToken}`
      }
    });
    
    if (createResponse.data.success) {
      const observationId = createResponse.data.id;
      console.log(`\n✅ Created observation: ${observationId}`);
      
      // Retrieve to verify
      console.log('\n🔍 Retrieving observation...');
      const getResponse = await axios.get(`http://localhost:3000/api/observations/${observationId}`, {
        headers: {
          'Cookie': `session=${sessionToken}`
        }
      });
      
      const data = getResponse.data;
      console.log('\n📊 Retrieved values:');
      console.log(`  Cluster: ${data.cluster ? `"${data.cluster}"` : '❌ NULL'}`);
      console.log(`  Position: ${data.inspectorPosition ? `"${data.inspectorPosition}"` : '❌ NULL'}`);
      console.log(`  Organization: ${data.inspectorOrganization ? `"${data.inspectorOrganization}"` : '❌ NULL'}`);
      
      // Test update
      console.log('\n✏️ Testing UPDATE via API...');
      const updatePayload = {
        sessionInfo: {
          cluster: "UPDATED CLUSTER VIA API",
          inspectorPosition: "UPDATED POSITION VIA API",
          inspectorOrganization: "UPDATED ORGANIZATION VIA API"
        }
      };
      
      const updateResponse = await axios.put(`http://localhost:3000/api/observations/${observationId}`, updatePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `session=${sessionToken}`
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Update successful');
        
        // Verify update
        const verifyResponse = await axios.get(`http://localhost:3000/api/observations/${observationId}`, {
          headers: {
            'Cookie': `session=${sessionToken}`
          }
        });
        
        const updated = verifyResponse.data;
        console.log('\n📊 Updated values:');
        console.log(`  Cluster: ${updated.cluster ? `"${updated.cluster}"` : '❌ NULL'}`);
        console.log(`  Position: ${updated.inspectorPosition ? `"${updated.inspectorPosition}"` : '❌ NULL'}`);
        console.log(`  Organization: ${updated.inspectorOrganization ? `"${updated.inspectorOrganization}"` : '❌ NULL'}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
  
  console.log('\n' + '=' .repeat(80));
}

// Run test
testAPIFields();