const axios = require('axios');

async function testLoginAndDashboard() {
  const baseUrl = 'http://localhost:3002';
  
  try {
    console.log('🔑 Testing login...');
    
    // Test login
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'chhinhs@gmail.com',
      password: 'admin123'
    }, {
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login status:', loginResponse.status);
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Login failed!');
      return;
    }
    
    // Extract cookie
    const cookies = loginResponse.headers['set-cookie'];
    const authCookie = cookies?.find(c => c.includes('auth-token'));
    
    if (!authCookie) {
      console.error('❌ No auth cookie received!');
      return;
    }
    
    console.log('✅ Login successful! Cookie received.');
    
    // Test session endpoint
    console.log('\n🔍 Testing session endpoint...');
    const sessionResponse = await axios.get(`${baseUrl}/api/auth/session`, {
      headers: {
        'Cookie': authCookie
      },
      validateStatus: () => true
    });
    
    console.log('Session status:', sessionResponse.status);
    console.log('Session response:', sessionResponse.data);
    
    // Test dashboard access
    console.log('\n📊 Testing dashboard access...');
    const dashboardResponse = await axios.get(`${baseUrl}/dashboard/admin`, {
      headers: {
        'Cookie': authCookie
      },
      validateStatus: () => true,
      maxRedirects: 0
    });
    
    console.log('Dashboard status:', dashboardResponse.status);
    console.log('Dashboard redirect:', dashboardResponse.headers.location || 'No redirect');
    
    if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard accessible!');
    } else if (dashboardResponse.status === 307) {
      console.log('⚠️  Dashboard redirected to:', dashboardResponse.headers.location);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testLoginAndDashboard();