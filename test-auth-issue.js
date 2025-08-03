const baseUrl = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('1. Testing login...');
  
  // Login
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'teacher@openplp.com',
      password: 'teacher123'
    }),
    credentials: 'include'
  });
  
  const loginData = await loginResponse.json();
  console.log('Login response:', loginResponse.status, loginData);
  
  // Get cookies from login response
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  console.log('Set-Cookie header:', setCookieHeader);
  
  // For fetch in Node.js, we need to extract cookies differently
  let cookieString = '';
  if (loginData.token) {
    cookieString = `auth-token=${loginData.token}`;
    console.log('Using token from response:', cookieString);
  }
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n2. Testing session with cookies...');
  
  // Test session
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    method: 'GET',
    headers: {
      'Cookie': cookieString
    },
    credentials: 'include'
  });
  
  const sessionData = await sessionResponse.json();
  console.log('Session response:', sessionResponse.status, sessionData);
  
  console.log('\n3. Testing verify-cookie endpoint...');
  
  // Test verify cookie
  const verifyResponse = await fetch(`${baseUrl}/api/auth/verify-cookie`, {
    method: 'GET',
    headers: {
      'Cookie': cookieString
    },
    credentials: 'include'
  });
  
  const verifyData = await verifyResponse.json();
  console.log('Verify response:', JSON.stringify(verifyData, null, 2));
}

// Run the test
testAuthFlow().catch(console.error);