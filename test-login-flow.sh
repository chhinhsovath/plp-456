#!/bin/bash

echo "Testing Authentication Flow..."
echo "=============================="

# Test login
echo -e "\n1. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@openplp.com","password":"admin123"}' \
  -c test-cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"
echo "Cookie saved to test-cookies.txt"

# Check cookie content
echo -e "\n2. Cookie Content:"
cat test-cookies.txt | grep auth-token || echo "No auth-token found!"

# Test session
echo -e "\n3. Testing Session API..."
SESSION_RESPONSE=$(curl -s http://localhost:3000/api/auth/session \
  -b test-cookies.txt \
  -w "\n%{http_code}")

SESSION_CODE=$(echo "$SESSION_RESPONSE" | tail -1)
SESSION_BODY=$(echo "$SESSION_RESPONSE" | head -n -1)

echo "HTTP Code: $SESSION_CODE"
echo "Response: $SESSION_BODY"

# Test dashboard access
echo -e "\n4. Testing Dashboard Access..."
DASHBOARD_RESPONSE=$(curl -s -I http://localhost:3000/dashboard/admin \
  -b test-cookies.txt)

echo "$DASHBOARD_RESPONSE" | head -10

# Clean up
rm -f test-cookies.txt