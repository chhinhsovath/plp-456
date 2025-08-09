# Deployment Guide

## Overview
This guide covers the complete deployment process for the MENTOR Teacher Observation Platform, including build, test, and deployment procedures.

## Deployment Environments

### 1. Local Development
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL
- **Purpose**: Development and testing

### 2. Staging
- **URL**: https://plp456-staging.vercel.app
- **Database**: Staging PostgreSQL (Supabase/Neon)
- **Purpose**: QA and user acceptance testing

### 3. Production
- **URL**: https://plp456.vercel.app
- **Database**: Production PostgreSQL
- **Purpose**: Live application

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] No security vulnerabilities (`npm audit`)

### Database
- [ ] Migrations tested on staging
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Data integrity verified

### Environment Variables
- [ ] All required env vars set
- [ ] Secrets properly configured
- [ ] API keys valid and not expired

## Deployment Methods

### Method 1: Automated CI/CD (Recommended)

#### Setup GitHub Actions
1. Configure secrets in GitHub repository settings:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
DATABASE_URL
NEXT_PUBLIC_API_URL
SLACK_WEBHOOK (optional)
```

2. Deploy by pushing to branch:
```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

### Method 2: Manual Deployment Script

#### Prerequisites
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

#### Deploy Commands
```bash
# Deploy to staging
./deploy/deploy.sh staging

# Deploy to production
./deploy/deploy.sh production

# Skip tests (not recommended)
./deploy/deploy.sh staging true
```

### Method 3: Direct Vercel Deployment

#### Initial Setup
```bash
# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_API_URL
```

#### Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Build Process

### 1. Install Dependencies
```bash
npm ci
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Build Application
```bash
npm run build
```

### 4. Verify Build
```bash
# Check build output
ls -la .next/

# Test production build locally
npm run start
```

## Database Deployment

### 1. Migration Strategy
```bash
# Generate migration
npx prisma migrate dev --name descriptive_name

# Apply migrations to staging
DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy

# Apply migrations to production
DATABASE_URL=$PRODUCTION_DB_URL npx prisma migrate deploy
```

### 2. Database Backup
```bash
# Backup before deployment
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
psql $DATABASE_URL < backup_file.sql
```

### 3. Seed Data (Staging Only)
```bash
# Seed staging database
DATABASE_URL=$STAGING_DB_URL npm run prisma:seed
```

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
API_RATE_LIMIT=100

# External Services
TELEGRAM_BOT_TOKEN=bot-token
TWILIO_ACCOUNT_SID=account-sid
TWILIO_AUTH_TOKEN=auth-token

# Monitoring
SENTRY_DSN=https://sentry.io/dsn
```

### Vercel Environment Variables
```bash
# Add variable for all environments
vercel env add VARIABLE_NAME

# Add for specific environment
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development
```

## Deployment Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Develop and test
npm run dev

# Run tests
npm test

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature
```

### 2. Pull Request
- Create PR to `develop` branch
- Wait for CI/CD checks to pass
- Get code review approval
- Merge to develop

### 3. Staging Deployment
- Automatic deployment on merge to `develop`
- Verify deployment at staging URL
- Run smoke tests
- Get QA approval

### 4. Production Deployment
```bash
# Create PR from develop to main
git checkout main
git pull origin main
git checkout -b release/v1.2.3
git merge develop

# Update version
npm version patch/minor/major

# Push and create PR
git push origin release/v1.2.3
```

### 5. Post-Deployment
- Monitor error rates
- Check performance metrics
- Verify all features working
- Update status page

## Rollback Procedures

### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Database Rollback
```bash
# Revert last migration
npx prisma migrate resolve --rolled-back

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

### Git Rollback
```bash
# Revert last commit
git revert HEAD
git push origin main

# Reset to specific commit
git reset --hard [commit-hash]
git push --force origin main
```

## Monitoring & Alerts

### Health Checks
```bash
# API health
curl https://api.example.com/health

# Application health
curl https://app.example.com/api/health
```

### Monitoring Setup
1. **Uptime Monitoring**: Configure Vercel Analytics
2. **Error Tracking**: Set up Sentry
3. **Performance**: Enable Web Vitals
4. **Logs**: Access via Vercel CLI

```bash
# View logs
vercel logs

# Follow logs
vercel logs --follow

# Filter logs
vercel logs --query "error"
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Check connection string
echo $DATABASE_URL
```

#### Environment Variable Issues
```bash
# List all env vars
vercel env ls

# Pull env vars locally
vercel env pull
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run build

# Verbose Vercel deployment
vercel --debug
```

## Security Considerations

### Pre-Deployment Security Check
```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for secrets in code
git secrets --scan
```

### Production Security
1. Enable HTTPS only
2. Set security headers
3. Configure CORS properly
4. Rate limit APIs
5. Enable WAF if available

## Performance Optimization

### Build Optimization
```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp']
  }
}
```

### Caching Strategy
1. Static assets: 1 year
2. API responses: Based on data type
3. HTML pages: No cache or short cache
4. Use ISR for semi-static content

## Deployment Automation

### GitHub Actions Secrets
```yaml
# Required secrets
VERCEL_TOKEN
VERCEL_ORG_ID  
VERCEL_PROJECT_ID
DATABASE_URL
PRODUCTION_URL
STAGING_URL
SLACK_WEBHOOK
```

### Custom Deployment Script
```bash
# Make executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh production
```

## Post-Deployment Checklist

### Immediate (0-5 minutes)
- [ ] Verify site is accessible
- [ ] Check critical user flows
- [ ] Monitor error rates
- [ ] Verify API endpoints

### Short-term (5-30 minutes)
- [ ] Run smoke tests
- [ ] Check all environment variables
- [ ] Verify database connectivity
- [ ] Test authentication flows

### Long-term (30+ minutes)
- [ ] Monitor performance metrics
- [ ] Check user feedback
- [ ] Verify analytics tracking
- [ ] Update documentation

## Emergency Contacts

### Escalation Path
1. **DevOps Lead**: Contact first for deployment issues
2. **Backend Lead**: Database or API issues
3. **Frontend Lead**: UI/UX issues
4. **Project Manager**: Business impact decisions

### Emergency Procedures
```bash
# Emergency rollback
./deploy/emergency-rollback.sh

# Maintenance mode
vercel env add MAINTENANCE_MODE true
```

Remember: Always test on staging before production deployment!