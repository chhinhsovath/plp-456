// Test login and then API access
const http = require('http');
const querystring = require('querystring');

const observationId = '1b8a1b2d-2237-47db-83f7-9b8c966253bf';

console.log('🔐 TESTING LOGIN AND API ACCESS');
console.log('=' .repeat(60));

// Step 1: Try to login with a simple admin user
function attemptLogin() {
  console.log('📝 Step 1: Attempting login...');
  
  const loginData = querystring.stringify({
    email: 'admin@openplp.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(loginData),
      'Accept': 'application/json'
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    console.log(`📊 Login Status: ${res.statusCode}`);
    console.log(`📋 Login Headers:`, res.headers);
    
    // Extract session cookie if successful
    let sessionCookie = '';
    if (res.headers['set-cookie']) {
      const cookies = res.headers['set-cookie'];
      const sessionCookieHeader = cookies.find(cookie => cookie.startsWith('session='));
      if (sessionCookieHeader) {
        sessionCookie = sessionCookieHeader.split(';')[0];
        console.log('🍪 Got session cookie:', sessionCookie);
      }
    }
    
    let loginResponseData = '';
    res.on('data', (chunk) => {
      loginResponseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 Login response:', loginResponseData);
      
      if (res.statusCode === 200 && sessionCookie) {
        console.log('✅ Login successful, testing API...');
        testAPI(sessionCookie);
      } else {
        console.log('❌ Login failed, trying alternative approach...');
        tryAlternativeLogin();
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ Login request error:', error.message);
    tryAlternativeLogin();
  });

  loginReq.write(loginData);
  loginReq.end();
}

// Alternative login approach
function tryAlternativeLogin() {
  console.log('\\n🔄 Step 1b: Trying simple-login endpoint...');
  
  const loginData = JSON.stringify({
    email: 'admin@openplp.com',
    password: 'password123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/simple-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData),
      'Accept': 'application/json'
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    console.log(`📊 Simple Login Status: ${res.statusCode}`);
    
    // Extract session cookie if successful
    let sessionCookie = '';
    if (res.headers['set-cookie']) {
      const cookies = res.headers['set-cookie'];
      const sessionCookieHeader = cookies.find(cookie => cookie.startsWith('session='));
      if (sessionCookieHeader) {
        sessionCookie = sessionCookieHeader.split(';')[0];
        console.log('🍪 Got session cookie:', sessionCookie);
      }
    }
    
    let loginResponseData = '';
    res.on('data', (chunk) => {
      loginResponseData += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 Simple login response:', loginResponseData);
      
      if (res.statusCode === 200 && sessionCookie) {
        console.log('✅ Simple login successful, testing API...');
        testAPI(sessionCookie);
      } else {
        console.log('❌ Both login methods failed');
        console.log('💡 You may need to login manually in the browser first');
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ Simple login request error:', error.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

// Test API with valid session cookie
function testAPI(sessionCookie) {
  console.log('\\n📡 Step 2: Testing observations API...');
  
  const apiOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/observations/${observationId}`,
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
      'Accept': 'application/json'
    }
  };

  const apiReq = http.request(apiOptions, (res) => {
    console.log(`📊 API Status: ${res.statusCode}`);
    
    let apiData = '';
    res.on('data', (chunk) => {
      apiData += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const observation = JSON.parse(apiData);
          console.log('✅ API Success! Critical fields:');
          console.log('- cluster:', JSON.stringify(observation.cluster));
          console.log('- inspectorName:', JSON.stringify(observation.inspectorName));
          console.log('- inspectorPosition:', JSON.stringify(observation.inspectorPosition));
          console.log('- inspectorOrganization:', JSON.stringify(observation.inspectorOrganization));
          
          // Compare with expected values
          console.log('\\n🎯 Comparison with database values:');
          console.log(`cluster: Expected "222", Got "${observation.cluster}"`, observation.cluster === '222' ? '✅' : '❌');
          console.log(`inspectorName: Expected "Demo Administrator", Got "${observation.inspectorName}"`, observation.inspectorName === 'Demo Administrator' ? '✅' : '❌');
          console.log(`inspectorPosition: Expected "Position", Got "${observation.inspectorPosition}"`, observation.inspectorPosition === 'Position' ? '✅' : '❌');
          console.log(`inspectorOrganization: Expected "Organization", Got "${observation.inspectorOrganization}"`, observation.inspectorOrganization === 'Organization' ? '✅' : '❌');
          
        } catch (error) {
          console.log('❌ Failed to parse API response:', error.message);
          console.log('Raw response:', apiData);
        }
      } else {
        console.log('❌ API call failed:', apiData);
      }
    });
  });

  apiReq.on('error', (error) => {
    console.error('❌ API request error:', error.message);
  });

  apiReq.end();
}

// Start the test
attemptLogin();