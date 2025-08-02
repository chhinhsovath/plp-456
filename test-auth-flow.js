// Test authentication flow
const axios = require('axios');

async function testAuth() {
  const baseURL = 'http://localhost:3000';
  
  console.log('1. Testing login...');
  try {
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'provincial@openplp.com',
      password: 'provincial123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Login successful:', loginResponse.data);
    console.log('Cookies received:', loginResponse.headers['set-cookie']);
    
    // Extract cookie
    const cookies = loginResponse.headers['set-cookie'];
    const authTokenCookie = cookies?.find(c => c.includes('auth-token'));
    
    if (!authTokenCookie) {
      console.error('No auth-token cookie received!');
      return;
    }
    
    console.log('\n2. Testing session with cookie...');
    const sessionResponse = await axios.get(`${baseURL}/api/auth/session`, {
      headers: {
        'Cookie': authTokenCookie
      }
    });
    
    console.log('Session valid:', sessionResponse.data);
    
    console.log('\n3. Testing dashboard access...');
    const dashboardResponse = await axios.get(`${baseURL}/dashboard/director`, {
      headers: {
        'Cookie': authTokenCookie
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    });
    
    console.log('Dashboard access status:', dashboardResponse.status);
    console.log('Location header:', dashboardResponse.headers.location);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testAuth();