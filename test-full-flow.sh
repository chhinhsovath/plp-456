#!/bin/bash

echo "=== Full Authentication Test ==="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Clean up
echo "1. Cleaning up old cookies..."
rm -f test-cookies.txt

# 2. Login
echo -e "\n2. Logging in as teacher@openplp.com..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@openplp.com","password":"teacher123"}' \
  -c test-cookies.txt \
  -w "\n%{http_code}")

LOGIN_CODE=$(echo "$LOGIN_RESULT" | tail -1)
if [ "$LOGIN_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "$LOGIN_RESULT" | head -n -1 | grep -o '"email":"[^"]*"' | head -1
else
  echo -e "${RED}✗ Login failed (HTTP $LOGIN_CODE)${NC}"
  exit 1
fi

# 3. Check session
echo -e "\n3. Checking session..."
SESSION=$(curl -s -b test-cookies.txt http://localhost:3000/api/auth/session)
if echo "$SESSION" | grep -q "teacher@openplp.com"; then
  echo -e "${GREEN}✓ Session valid${NC}"
  echo "$SESSION" | grep -o '"role":"[^"]*"'
else
  echo -e "${RED}✗ Session check failed${NC}"
  echo "$SESSION"
fi

# 4. Test all pages
echo -e "\n4. Testing page access..."
PAGES=(
  "/dashboard"
  "/dashboard/admin"
  "/dashboard/analytics"
  "/dashboard/evaluations"
  "/dashboard/mentoring"
  "/dashboard/mentoring/sessions"
  "/dashboard/schools"
  "/dashboard/users"
  "/dashboard/settings"
)

FAILED=0
for PAGE in "${PAGES[@]}"; do
  STATUS=$(curl -s -b test-cookies.txt -o /dev/null -w "%{http_code}" http://localhost:3000$PAGE)
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} $PAGE - OK"
  else
    echo -e "${RED}✗${NC} $PAGE - Failed (HTTP $STATUS)"
    FAILED=$((FAILED + 1))
  fi
done

# 5. Test API endpoints
echo -e "\n5. Testing API endpoints..."
API_ENDPOINTS=(
  "/api/auth/session"
  "/api/schools"
  "/api/users"
)

for ENDPOINT in "${API_ENDPOINTS[@]}"; do
  RESPONSE=$(curl -s -b test-cookies.txt -w "\n%{http_code}" http://localhost:3000$ENDPOINT)
  STATUS=$(echo "$RESPONSE" | tail -1)
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} $ENDPOINT - OK"
  else
    echo -e "${RED}✗${NC} $ENDPOINT - Failed (HTTP $STATUS)"
    FAILED=$((FAILED + 1))
  fi
done

# Summary
echo -e "\n=== Summary ==="
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}$FAILED tests failed${NC}"
fi

# Clean up
rm -f test-cookies.txt