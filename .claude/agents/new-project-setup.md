Initial Project Setup Prompt
Create a new React + Next.js project with the following tech stack and requirements:

**Tech Stack:**
- Next.js (latest stable version with App Router)
- React
- TypeScript
- Tailwind CSS for styling
- shadcn/ui for components
- Tweakcn for theme customization
- Better Auth for authentication
- PostgreSQL database
- Mermaid for diagramming and charts
- Vercel CLI for deployment

**Project Structure Requirements:**
1. Set up the project with proper folder structure following Next.js 14+ best practices
2. Configure Tailwind CSS with custom theme integration
3. Install and configure shadcn/ui components
4. Set up Tweakcn for rapid theme building
5. Implement Better Auth with PostgreSQL integration
6. Configure database schema and migrations
7. Set up Mermaid for diagrams and charts
8. Configure Vercel CLI for deployment
9. Add proper TypeScript configurations
10. Set up environment variables structure

**Authentication Features:**
- User registration and login
- Password reset functionality
- Session management
- Protected routes
- User profile management

**Database Setup:**
- PostgreSQL connection configuration
- User authentication tables
- Sample data models for [specify your use case]
- Database migrations setup

**UI/UX Requirements:**
- Responsive design with Tailwind
- Dark/light mode toggle using Tweakcn
- Clean, modern interface with shadcn components
- Loading states and error handling
- Form validation

**Additional Features:**
- Mermaid diagram integration for [specify use case - flowcharts, user journeys, etc.]
- Chart components for data visualization
- SEO optimization
- Performance optimization

**Development Setup:**
- ESLint and Prettier configuration
- Git setup with proper .gitignore
- Development and production environment configs

Please create the complete project structure, install all dependencies, configure all tools, and provide a working foundation that I can build upon. Include setup instructions and any necessary environment variables.
Follow-up Development Prompts
For Feature Development:
Add [specific feature] to the project following these requirements:
- Use shadcn components where possible
- Implement proper error handling and loading states
- Follow TypeScript best practices
- Include Mermaid diagrams for complex workflows
- Ensure responsive design with Tailwind
- Add proper authentication checks if needed
For Debugging and Optimization:
Review and optimize the current codebase:
- Fix any TypeScript errors
- Optimize database queries
- Improve component performance
- Enhance accessibility
- Update Tailwind configurations
- Verify Better Auth implementation
- Test Vercel deployment configuration
For Database Operations:
Create/modify database operations for:
- [Specify your data models]
- Implement CRUD operations
- Add proper validation and error handling
- Create database migrations
- Set up seed data
- Optimize queries for performance


Create a new React + Next.js project with the following tech stack and deployment pipeline:

**Tech Stack:**
- Next.js (latest stable version with App Router)
- React
- TypeScript
- Tailwind CSS for styling
- shadcn/ui for components
- Tweakcn for theme customization
- Better Auth for authentication
- PostgreSQL database
- Mermaid for diagramming and charts
- Vercel CLI for deployment

**Deployment Pipeline Requirements:**
1. **Pre-commit Validation:**
   - Set up Husky for Git hooks
   - Configure lint-staged for pre-commit checks
   - ESLint and Prettier validation
   - TypeScript type checking
   - Unit test execution
   - Build verification

2. **Local Development Workflow:**
   - Hot reload with error overlay
   - Real-time TypeScript checking
   - Live database connection testing
   - Component testing with Storybook (optional)

3. **Build and Test Pipeline:**
   - `npm run build` must pass without errors
   - TypeScript compilation check
   - ESLint validation with zero warnings
   - Prettier formatting check
   - Database connection verification
   - Environment variable validation

4. **Git Workflow:**
   - Automatic pre-commit hooks
   - Commit message linting (conventional commits)
   - Branch protection with required checks
   - Automated testing on pull requests

5. **Deployment Stages:**
   - Preview deployments for pull requests
   - Production deployment only after all checks pass
   - Database migration verification
   - Environment-specific configurations
   - Rollback strategy

**Pre-commit Hook Configuration:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run type-check && npm run build",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,md}": [
      "prettier --write"
    ]
  }
}

Package.json Scripts:

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --fix",
    "lint:check": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "pre-deploy": "npm run lint:check && npm run type-check && npm run build && npm run test",
    "deploy:preview": "vercel",
    "deploy:production": "vercel --prod",
    "validate-env": "node scripts/validate-env.js"
  }
}


Build Validation Script:
// scripts/validate-build.ts
export async function validateBuild() {
  try {
    // Check environment variables
    await validateEnvironmentVariables();
    
    // Test database connection
    await testDatabaseConnection();
    
    // Verify all imports resolve
    await validateImports();
    
    // Check for unused dependencies
    await checkUnusedDependencies();
    
    console.log('✅ Build validation passed');
  } catch (error) {
    console.error('❌ Build validation failed:', error);
    process.exit(1);
  }
}