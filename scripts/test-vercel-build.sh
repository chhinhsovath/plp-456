#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting Vercel Build Test..."
echo "================================"

# Validate environment variables
echo "🔐 Validating environment variables..."
node scripts/validate-env.js
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Environment validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment variables validated${NC}"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Run TypeScript check
echo "🔍 Running TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ TypeScript errors found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ TypeScript check passed${NC}"

# Run ESLint
echo "🔍 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  ESLint warnings/errors found${NC}"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to generate Prisma client${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Run the build
echo "🏗️  Running Next.js build..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All checks passed! Your build is ready for Vercel deployment.${NC}"
echo "================================"
echo "Build artifacts created in .next/"