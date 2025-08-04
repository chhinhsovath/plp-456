async function testAPIDirectly() {
  try {
    console.log('Testing login API directly...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@openplp.com',
        password: 'admin123'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    // Test session endpoint
    console.log('\nTesting session endpoint...');
    const sessionResponse = await fetch('http://localhost:3001/api/auth/session', {
      credentials: 'include',
      headers: {
        'Cookie': response.headers.get('set-cookie') || ''
      }
    });
    
    console.log('Session status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Session data:', sessionData);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPIDirectly();