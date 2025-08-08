// Test API response for observation fields
const https = require('https');

const observationId = '1b8a1b2d-2237-47db-83f7-9b8c966253bf';

// Create a simple HTTP request to test the API
const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/observations/${observationId}`,
  method: 'GET',
  headers: {
    'Cookie': 'session=2Z1PLWJjL-NdWlXpBqM_YCvMtw97s68gI3pQvQ7pjXA'
  }
};

console.log('🔍 Testing API response for critical fields...\n');

const req = require('http').request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const observation = JSON.parse(data);
      
      console.log('📊 API Response Analysis:');
      console.log('Status:', res.statusCode);
      console.log('\n🔍 Critical Fields in Response:');
      console.log('- cluster:', observation.cluster);
      console.log('- inspectorName:', observation.inspectorName);
      console.log('- inspectorPosition:', observation.inspectorPosition);
      console.log('- inspectorOrganization:', observation.inspectorOrganization);
      
      console.log('\n🏗️ Field Presence Check:');
      console.log('- cluster exists:', 'cluster' in observation);
      console.log('- inspectorName exists:', 'inspectorName' in observation);
      console.log('- inspectorPosition exists:', 'inspectorPosition' in observation);
      console.log('- inspectorOrganization exists:', 'inspectorOrganization' in observation);
      
      console.log('\n💾 Field Values (raw):');
      console.log('- cluster:', JSON.stringify(observation.cluster));
      console.log('- inspectorName:', JSON.stringify(observation.inspectorName));
      console.log('- inspectorPosition:', JSON.stringify(observation.inspectorPosition));
      console.log('- inspectorOrganization:', JSON.stringify(observation.inspectorOrganization));
      
      // Check if data matches database
      console.log('\n🎯 Database vs API Comparison:');
      console.log('Expected from DB vs Actual from API:');
      console.log(`- cluster: '222' vs '${observation.cluster}'`, observation.cluster === '222' ? '✅' : '❌');
      console.log(`- inspectorName: 'Demo Administrator' vs '${observation.inspectorName}'`, observation.inspectorName === 'Demo Administrator' ? '✅' : '❌');
      console.log(`- inspectorPosition: 'Position' vs '${observation.inspectorPosition}'`, observation.inspectorPosition === 'Position' ? '✅' : '❌');
      console.log(`- inspectorOrganization: 'Organization' vs '${observation.inspectorOrganization}'`, observation.inspectorOrganization === 'Organization' ? '✅' : '❌');
      
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.end();