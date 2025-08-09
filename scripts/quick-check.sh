#!/bin/bash

# Quick pre-deployment check script
# Use this for a faster check before pushing to Git

echo "🚀 Quick Pre-Deploy Check"
echo "========================="

# Check TypeScript
echo "📝 TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found!"
    exit 1
fi
echo "✅ TypeScript OK"

# Check environment
echo "🔐 Environment check..."
node scripts/validate-env.js > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Environment variables missing!"
    echo "   Run: node scripts/validate-env.js"
    exit 1
fi
echo "✅ Environment OK"

echo ""
echo "✅ Quick checks passed!"
echo "   For full build test run: npm run test-build"