# Deployment Guide - Vercel Build Error Prevention
  # npm run verify:build - Full build verification
  # npm run check:env - Environment variable check
  # npm run vercel:build - Test Vercel production build
  # npm run vercel:dev - Run Vercel dev server
This guide explains the tools and processes set up to catch Vercel deployment errors before pushing to GitHub.

## 🛠️ Tools Installed

1. **Vercel CLI** - For local build testing
2. **Husky** - Git hooks for pre-commit checks
3. **Lint-staged** - Run linters on staged files
4. **Environment validation** - Check for missing env variables

## 📋 Available Commands

### Quick Verification
```bash
npm run verify:build
```
This runs a comprehensive build check including:
- TypeScript type checking
- ESLint validation
- Prisma client generation
- Next.js production build
- Vercel build simulation

### Environment Check
```bash
npm run check:env
```
Validates that all required environment variables are present.

### Vercel Commands
```bash
npm run vercel:build  # Test production build locally
npm run vercel:dev    # Run Vercel development server
```

## 🔒 Automatic Pre-commit Checks

When you commit, the following checks run automatically:
1. Lint-staged (ESLint + Prettier on changed files)
2. TypeScript type checking
3. Full ESLint check
4. Vercel build verification

To skip pre-commit hooks (not recommended):
```bash
git commit --no-verify
```

## 🚀 GitHub Actions

A workflow runs on every push and PR to:
- Install dependencies
- Run TypeScript checks
- Run ESLint
- Generate Prisma client
- Build the project

## 📝 Best Practices

1. **Before pushing to GitHub:**
   ```bash
   npm run verify:build
   ```

2. **Check environment variables:**
   ```bash
   npm run check:env
   ```

3. **Keep .env.example updated** with all required variables

4. **Never commit sensitive data** - Use environment variables

5. **Fix all TypeScript errors** before committing

## 🔧 Troubleshooting

### Build fails locally but not on Vercel
- Check Node.js version matches Vercel's
- Ensure all env variables are set in Vercel dashboard
- Clear cache: `rm -rf .next node_modules && npm install`

### Pre-commit hook fails
- Run `npm run lint` to see all linting errors
- Run `npx tsc --noEmit` for TypeScript errors
- Check `npm run verify:build` output

### Environment variable issues
- Update .env.example with new variables
- Run `npm run check:env` to validate
- Set variables in Vercel dashboard

## 🎯 Quick Start for New Developers

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Fill in all required environment variables
4. Run `npm install`
5. Run `npm run verify:build` to ensure everything works
6. Start developing with `npm run dev`

## 📦 Deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment check passes (`npm run check:env`)
- [ ] Vercel build check passes (`npm run verify:build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All environment variables set in Vercel dashboard
- [ ] Committed and pushed all changes