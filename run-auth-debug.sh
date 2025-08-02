#!/bin/bash

echo "🚀 Starting authentication debug test..."
echo "Make sure the app is running on http://localhost:3000"
echo ""

# Create evidence directory
mkdir -p tests/evidence

# Run the test
npx ts-node tests/auth-debug.test.ts

echo ""
echo "✅ Test complete! Check the evidence folder for results."