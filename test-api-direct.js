// Direct API test script
const http = require('http');

const observationId = '1b8a1b2d-2237-47db-83f7-9b8c966253bf';

// Using a valid session cookie - you may need to update this
const sessionCookie = 'session=2Z1PLWJjL-NdWlXpBqM_YCvMtw97s68gI3pQvQ7pjXA';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/observations/${observationId}`,
  method: 'GET',
  headers: {
    'Cookie': sessionCookie,
    'Accept': 'application/json',
    'User-Agent': 'Test-Script/1.0'
  }
};

console.log('🔍 Testing API: GET /api/observations/' + observationId);
console.log('🔗 URL: http://localhost:3000' + options.path);
console.log('🍪 Cookie: ' + sessionCookie);
console.log('=' .repeat(60));

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  console.log('=' .repeat(60));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Raw Response:');
    console.log(data);
    console.log('=' .repeat(60));
    
    // Try to parse as JSON
    try {
      const observation = JSON.parse(data);
      
      console.log('✅ Successfully parsed JSON');
      console.log('🏷️  Observation ID:', observation.id);
      console.log('');
      console.log('🔍 Critical Fields Analysis:');
      console.log('- cluster:', JSON.stringify(observation.cluster), '(type:', typeof observation.cluster, ')');
      console.log('- inspectorName:', JSON.stringify(observation.inspectorName), '(type:', typeof observation.inspectorName, ')');
      console.log('- inspectorPosition:', JSON.stringify(observation.inspectorPosition), '(type:', typeof observation.inspectorPosition, ')');
      console.log('- inspectorOrganization:', JSON.stringify(observation.inspectorOrganization), '(type:', typeof observation.inspectorOrganization, ')');
      
      console.log('');
      console.log('🎯 Expected vs Actual:');
      console.log(`cluster: Expected "222", Got "${observation.cluster}"`);
      console.log(`inspectorName: Expected "Demo Administrator", Got "${observation.inspectorName}"`);
      console.log(`inspectorPosition: Expected "Position", Got "${observation.inspectorPosition}"`);
      console.log(`inspectorOrganization: Expected "Organization", Got "${observation.inspectorOrganization}"`);
      
      console.log('');
      console.log('🏗️ Field Presence Check:');
      console.log('- cluster in response:', 'cluster' in observation, observation.hasOwnProperty('cluster'));
      console.log('- inspectorName in response:', 'inspectorName' in observation, observation.hasOwnProperty('inspectorName'));
      console.log('- inspectorPosition in response:', 'inspectorPosition' in observation, observation.hasOwnProperty('inspectorPosition'));
      console.log('- inspectorOrganization in response:', 'inspectorOrganization' in observation, observation.hasOwnProperty('inspectorOrganization'));
      
      console.log('');
      console.log('📊 Other Notable Fields:');
      console.log('- province:', observation.province);
      console.log('- school:', observation.school);
      console.log('- nameOfTeacher:', observation.nameOfTeacher);
      console.log('- user:', observation.user ? `{id: ${observation.user.id}, name: "${observation.user.name}"}` : 'null');
      
    } catch (error) {
      console.log('❌ Failed to parse JSON:', error.message);
      console.log('🔍 Raw response type:', typeof data);
      
      // Check if it's a redirect
      if (data.includes('/login')) {
        console.log('🔒 Looks like a redirect to login - authentication issue');
      }
    }
    
    console.log('=' .repeat(60));
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.setTimeout(10000, () => {
  console.error('⏰ Request timed out');  
  req.destroy();
});

req.end();