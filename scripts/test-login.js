// Quick test login script
const loginData = {
  email: 'teacher@openplp.com',
  password: 'teacher123'
};

fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData),
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('Login successful:', data);
  console.log('You can now access: http://localhost:3000/dashboard/observations/new');
})
.catch(err => console.error('Login failed:', err));