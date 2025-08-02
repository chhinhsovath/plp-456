const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiY2hoaW5oc0BnbWFpbC5jb20iLCJyb2xlIjoiQURNSU5JU1RSQVRPUiIsImlhdCI6MTc1NDA2ODI4OCwiZXhwIjoxNzU2NjYwMjg4fQ.mc9Niqb7fLfED--FBHV0bXrK9abgmU34y6bY_GG1WZE";

// Decode without verification to see the payload
const decoded = jwt.decode(token);
console.log('Decoded JWT payload:', decoded);

// Check the types
console.log('\nType checks:');
console.log('userId type:', typeof decoded.userId);
console.log('userId value:', decoded.userId);