const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test token from login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTklTVFJBVE9SIiwiaWF0IjoxNzU0MDcxMjQ3LCJleHAiOjE3NTY2NjMyNDd9.cYnbo11cC4rg1yjOWgRak3lM_c2c24nX8e_wUJ8nISk';

console.log('JWT_SECRET:', JWT_SECRET);

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token is valid!');
  console.log('Decoded:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
  
  // Try with the actual secret from .env
  const actualSecret = 'PSVuds+FZESbt27eVKpWnz7sdsNyaKDjYdoksrbXadg=';
  try {
    const decoded = jwt.verify(token, actualSecret);
    console.log('Token is valid with actual secret!');
    console.log('Decoded:', decoded);
  } catch (err) {
    console.error('Still failed with actual secret:', err.message);
  }
}