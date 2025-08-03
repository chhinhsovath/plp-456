#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting Vercel Build Verification..."
echo "======================================="

# Track if any checks fail
FAILED=0

# Function to run a command and check its status
run_check() {
    local description=$1
    local command=$2
    
    echo -e "\n${YELLOW}▶ ${description}${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✓ ${description} passed${NC}"
    else
        echo -e "${RED}✗ ${description} failed${NC}"
        FAILED=1
    fi
}

# 1. Check Node version
echo -e "\n${YELLOW}▶ Checking Node.js version${NC}"
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# 2. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}▶ Installing dependencies...${NC}"
    npm ci || npm install
fi

# 3. Generate Prisma client
run_check "Generating Prisma client" "npm run prisma:generate"

# 4. TypeScript check
run_check "TypeScript type checking" "npx tsc --noEmit"

# 5. ESLint check
run_check "ESLint" "npm run lint"

# 6. Check for missing environment variables
echo -e "\n${YELLOW}▶ Checking environment variables${NC}"
if [ -f ".env.example" ]; then
    while IFS= read -r line; do
        if [[ ! -z "$line" && ! "$line" =~ ^# ]]; then
            var_name=$(echo "$line" | cut -d'=' -f1)
            if [ -z "${!var_name}" ]; then
                echo -e "${YELLOW}⚠ Warning: Environment variable $var_name is not set${NC}"
            fi
        fi
    done < .env.example
fi

# 7. Run Next.js build
echo -e "\n${YELLOW}▶ Running Next.js production build${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Next.js build successful${NC}"
else
    echo -e "${RED}✗ Next.js build failed${NC}"
    FAILED=1
fi

# 8. Check build output
if [ -d ".next" ]; then
    echo -e "${GREEN}✓ Build output directory exists${NC}"
    
    # Check build size
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "Build size: $BUILD_SIZE"
else
    echo -e "${RED}✗ Build output directory not found${NC}"
    FAILED=1
fi

# 9. Run Vercel build (if logged in)
echo -e "\n${YELLOW}▶ Running Vercel build check${NC}"
if npx vercel --version > /dev/null 2>&1; then
    if npx vercel build --prod --no-confirm; then
        echo -e "${GREEN}✓ Vercel build successful${NC}"
    else
        echo -e "${RED}✗ Vercel build failed${NC}"
        FAILED=1
    fi
else
    echo -e "${YELLOW}⚠ Vercel CLI not available, skipping Vercel build${NC}"
fi

# Summary
echo -e "\n======================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues before deploying.${NC}"
    exit 1
fi