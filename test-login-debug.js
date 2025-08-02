const fetch = require('node-fetch');

async function testLogin() {
  console.log('Testing login to PLP-456...\n');
  
  const testAccounts = [
    { email: 'admin@openplp.com', password: 'admin123', role: 'ADMINISTRATOR' },
    { email: 'teacher@openplp.com', password: 'teacher123', role: 'TEACHER' },
    { email: 'mentor@openplp.com', password: 'mentor123', role: 'MENTOR' },
    { email: 'officer@openplp.com', password: 'officer123', role: 'OFFICER' },
  ];

  for (const account of testAccounts) {
    console.log(`\nTrying ${account.email} (${account.role})...`);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });

      const data = await response.json();
      console.log('Response:', response.status, data);
      
      if (response.ok) {
        console.log('✅ Login successful\!');
        console.log('Token:', data.token);
        
        // Test session endpoint
        const sessionResponse = await fetch('http://localhost:3001/api/auth/session', {
          headers: {
            'Cookie': `auth-token=${data.token}`
          }
        });
        
        const sessionData = await sessionResponse.json();
        console.log('Session data:', sessionData);
      } else {
        console.log('❌ Login failed');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
EOF < /dev/null