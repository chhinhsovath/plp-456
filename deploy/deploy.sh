#!/bin/bash

# Deployment script for MENTOR
# Usage: ./deploy.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SKIP_TESTS=${2:-false}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="deploy_${ENVIRONMENT}_${TIMESTAMP}.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Pre-deployment checks
pre_deploy_checks() {
    log "Running pre-deployment checks..."
    
    # Check Node.js version
    NODE_VERSION=$(node -v)
    log "Node.js version: $NODE_VERSION"
    
    # Check npm version
    NPM_VERSION=$(npm -v)
    log "npm version: $NPM_VERSION"
    
    # Check git status
    if [[ -n $(git status -s) ]]; then
        warning "Uncommitted changes detected"
        git status -s
        read -p "Continue with deployment? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    log "Current branch: $CURRENT_BRANCH"
    
    if [[ "$ENVIRONMENT" == "production" && "$CURRENT_BRANCH" != "main" ]]; then
        error "Production deployments must be from main branch"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm ci
    
    log "Generating Prisma client..."
    npx prisma generate
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warning "Skipping tests (not recommended for production)"
        return
    fi
    
    log "Running tests..."
    
    # Lint
    log "Running linter..."
    npm run lint || error "Linting failed"
    
    # Type check
    log "Running type check..."
    npx tsc --noEmit || error "Type checking failed"
    
    # API tests
    log "Running API tests..."
    npm run test:api || error "API tests failed"
    
    # E2E tests (optional for faster deployment)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Running E2E tests..."
        npm run test:e2e || error "E2E tests failed"
    fi
}

# Build application
build_application() {
    log "Building application for $ENVIRONMENT..."
    
    # Load environment variables
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        export $(cat .env.$ENVIRONMENT | xargs)
    fi
    
    # Build Next.js
    npm run build || error "Build failed"
    
    # Verify build
    if [[ ! -d ".next" ]]; then
        error "Build directory not found"
    fi
    
    log "Build completed successfully"
}

# Database migrations
run_migrations() {
    log "Running database migrations..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Backup database first
        log "Creating database backup..."
        pg_dump $DATABASE_URL > "backup_${TIMESTAMP}.sql"
    fi
    
    # Run migrations
    npx prisma migrate deploy || error "Migration failed"
    
    log "Migrations completed"
}

# Deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel ($ENVIRONMENT)..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel --prod || error "Vercel deployment failed"
    else
        vercel || error "Vercel deployment failed"
    fi
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --token $VERCEL_TOKEN | grep $ENVIRONMENT | head -1 | awk '{print $2}')
    log "Deployed to: $DEPLOYMENT_URL"
}

# Deploy to custom server
deploy_custom() {
    log "Deploying to custom server..."
    
    # Build deployment package
    log "Creating deployment package..."
    tar -czf "deploy_${TIMESTAMP}.tar.gz" \
        .next \
        public \
        package.json \
        package-lock.json \
        prisma \
        next.config.js
    
    # Upload to server
    log "Uploading to server..."
    scp "deploy_${TIMESTAMP}.tar.gz" "$DEPLOY_USER@$DEPLOY_HOST:/tmp/"
    
    # Deploy on server
    ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        cd $DEPLOY_PATH
        tar -xzf /tmp/deploy_${TIMESTAMP}.tar.gz
        npm ci --production
        pm2 restart plp456
        rm /tmp/deploy_${TIMESTAMP}.tar.gz
EOF
    
    log "Deployment completed"
}

# Post-deployment tasks
post_deploy() {
    log "Running post-deployment tasks..."
    
    # Run smoke tests
    log "Running smoke tests..."
    npm run test:smoke || warning "Smoke tests failed"
    
    # Clear CDN cache
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Clearing CDN cache..."
        # Add CDN cache clearing logic here
    fi
    
    # Send notification
    send_notification
}

# Send deployment notification
send_notification() {
    log "Sending deployment notification..."
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Deployment completed: $ENVIRONMENT (Branch: $CURRENT_BRANCH)\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    # Email notification
    if [[ -n "$NOTIFY_EMAIL" ]]; then
        echo "Deployment completed for $ENVIRONMENT" | mail -s "MENTOR Deployment" "$NOTIFY_EMAIL"
    fi
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    if [[ "$DEPLOYMENT_TYPE" == "vercel" ]]; then
        log "Rolling back Vercel deployment..."
        vercel rollback
    else
        log "Rolling back custom deployment..."
        ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd $DEPLOY_PATH && pm2 restart plp456"
    fi
    
    error "Rollback completed. Please check the logs."
}

# Main deployment flow
main() {
    log "Starting deployment for $ENVIRONMENT environment"
    
    # Set deployment type
    DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE:-vercel}
    
    # Trap errors for rollback
    trap rollback ERR
    
    # Execute deployment steps
    pre_deploy_checks
    install_dependencies
    run_tests
    build_application
    run_migrations
    
    # Deploy based on type
    if [[ "$DEPLOYMENT_TYPE" == "vercel" ]]; then
        deploy_vercel
    else
        deploy_custom
    fi
    
    post_deploy
    
    log "✅ Deployment completed successfully!"
    log "📄 Deployment log: $DEPLOY_LOG"
}

# Run main function
main