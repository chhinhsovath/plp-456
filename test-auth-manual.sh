#!/bin/bash

echo "🔍 Manual Authentication Test Script"
echo "===================================="
echo ""

# Test 1: Login
echo "1. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@openplp.com","password":"teacher123"}' \
  -c cookies.txt \
  -w "\nSTATUS:%{http_code}")

STATUS=$(echo "$LOGIN_RESPONSE" | grep "STATUS:" | cut -d':' -f2)
echo "Login status: $STATUS"

if [ "$STATUS" = "200" ]; then
  echo "✅ Login successful"
  echo "Response: $(echo "$LOGIN_RESPONSE" | grep -v "STATUS:")"
else
  echo "❌ Login failed"
  exit 1
fi

echo ""
echo "2. Checking cookies..."
if [ -f cookies.txt ]; then
  echo "Cookies saved:"
  cat cookies.txt | grep -E "auth-token|dev-auth-token" || echo "No auth cookies found"
fi

echo ""
echo "3. Testing session endpoint..."
SESSION_RESPONSE=$(curl -s http://localhost:3000/api/auth/session \
  -b cookies.txt \
  -w "\nSTATUS:%{http_code}")

STATUS=$(echo "$SESSION_RESPONSE" | grep "STATUS:" | cut -d':' -f2)
echo "Session status: $STATUS"

if [ "$STATUS" = "200" ]; then
  echo "✅ Session valid"
  echo "Response: $(echo "$SESSION_RESPONSE" | grep -v "STATUS:")"
else
  echo "❌ Session invalid"
fi

echo ""
echo "4. Testing protected API endpoints..."
ENDPOINTS=(
  "/api/observations"
  "/api/evaluations"
  "/api/users"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo -n "Testing $endpoint... "
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$endpoint -b cookies.txt)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
    echo "✅ Authenticated (Status: $STATUS)"
  else
    echo "❌ Not authenticated (Status: $STATUS)"
  fi
done

echo ""
echo "5. Testing dashboard pages (checking for redirects)..."
PAGES=(
  "/dashboard"
  "/dashboard/observations"
  "/dashboard/evaluations"
  "/dashboard/analytics"
)

for page in "${PAGES[@]}"; do
  echo -n "Testing $page... "
  FINAL_URL=$(curl -s -L -o /dev/null -w "%{url_effective}" http://localhost:3000$page -b cookies.txt)
  if [[ "$FINAL_URL" == *"/login"* ]]; then
    echo "❌ Redirected to login"
  else
    echo "✅ Access granted (Final URL: $FINAL_URL)"
  fi
done

# Cleanup
rm -f cookies.txt

echo ""
echo "✅ Test completed"