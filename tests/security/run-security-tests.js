#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityTestRunner {
  constructor() {
    this.results = {
      unitTests: null,
      penetrationTests: null,
      dependencies: null,
      overall: 'PENDING'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runUnitTests() {
    this.log('Running security unit tests...');
    try {
      execSync('npm test -- __tests__/security.test.ts', { stdio: 'inherit' });
      this.results.unitTests = 'PASSED';
      this.log('Security unit tests passed', 'success');
    } catch (error) {
      this.results.unitTests = 'FAILED';
      this.log('Security unit tests failed', 'error');
      throw error;
    }
  }

  async runPenetrationTests() {
    this.log('Running penetration tests...');
    try {
      // Check if server is running
      const serverCheck = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', {
        encoding: 'utf8'
      }).trim();

      if (serverCheck !== '200' && serverCheck !== '302') {
        this.log('Server not running. Starting development server...', 'warning');
        // Start server in background
        execSync('npm run dev &', { stdio: 'ignore' });
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      execSync('node tests/security/penetration-tests.js', { stdio: 'inherit' });
      this.results.penetrationTests = 'PASSED';
      this.log('Penetration tests passed', 'success');
    } catch (error) {
      this.results.penetrationTests = 'FAILED';
      this.log('Penetration tests failed', 'error');
      throw error;
    }
  }

  async checkDependencies() {
    this.log('Checking for vulnerable dependencies...');
    try {
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(output);
      
      const vulnerabilities = {
        critical: audit.metadata.vulnerabilities.critical || 0,
        high: audit.metadata.vulnerabilities.high || 0,
        moderate: audit.metadata.vulnerabilities.moderate || 0,
        low: audit.metadata.vulnerabilities.low || 0
      };

      this.log(`Found vulnerabilities: Critical: ${vulnerabilities.critical}, High: ${vulnerabilities.high}, Moderate: ${vulnerabilities.moderate}, Low: ${vulnerabilities.low}`);

      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        this.results.dependencies = 'FAILED';
        this.log('Critical or high severity vulnerabilities found!', 'error');
        
        // Try to fix automatically
        this.log('Attempting to fix vulnerabilities...', 'warning');
        try {
          execSync('npm audit fix', { stdio: 'inherit' });
          this.log('Some vulnerabilities fixed. Re-checking...', 'info');
          
          // Re-check
          const recheck = execSync('npm audit --json', { encoding: 'utf8' });
          const reaudit = JSON.parse(recheck);
          
          if (reaudit.metadata.vulnerabilities.critical === 0 && reaudit.metadata.vulnerabilities.high === 0) {
            this.results.dependencies = 'PASSED';
            this.log('All critical vulnerabilities fixed', 'success');
          }
        } catch (fixError) {
          this.log('Could not automatically fix all vulnerabilities', 'warning');
        }
      } else {
        this.results.dependencies = 'PASSED';
        this.log('No critical vulnerabilities found', 'success');
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        // Parse and check severity
        try {
          const audit = JSON.parse(error.stdout);
          if (audit.metadata.vulnerabilities.critical > 0 || audit.metadata.vulnerabilities.high > 0) {
            this.results.dependencies = 'FAILED';
            this.log('Dependency check failed due to vulnerabilities', 'error');
          } else {
            this.results.dependencies = 'PASSED';
            this.log('Only low/moderate vulnerabilities found', 'warning');
          }
        } catch (parseError) {
          this.results.dependencies = 'ERROR';
          this.log('Could not parse npm audit results', 'error');
        }
      } else {
        this.results.dependencies = 'ERROR';
        this.log('Dependency check failed', 'error');
      }
    }
  }

  async checkSecurityConfigs() {
    this.log('Checking security configurations...');
    const issues = [];

    // Check for .env in git
    if (fs.existsSync('.env')) {
      try {
        execSync('git check-ignore .env', { stdio: 'ignore' });
      } catch {
        issues.push('.env file is not in .gitignore!');
      }
    }

    // Check for exposed secrets
    const secretPatterns = [
      /(?:api[_-]?key|apikey|secret[_-]?key|private[_-]?key|encryption[_-]?key)[\s]*[:=][\s]*['"]?[a-zA-Z0-9+\/=]{20,}/gi,
      /(?:password|passwd|pwd)[\s]*[:=][\s]*['"]?[^\s'"]{8,}/gi,
      /(?:token|auth[_-]?token|access[_-]?token)[\s]*[:=][\s]*['"]?[a-zA-Z0-9+\/=]{20,}/gi
    ];

    const filesToCheck = [
      'middleware.ts',
      'lib/auth.ts',
      'lib/encryption.ts',
      '.env.example'
    ];

    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of secretPatterns) {
          if (pattern.test(content) && !file.includes('.example')) {
            issues.push(`Possible exposed secret in ${file}`);
          }
        }
      }
    }

    // Check HTTPS enforcement
    const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
    if (!middlewareContent.includes('x-forwarded-proto')) {
      issues.push('HTTPS enforcement not configured in middleware');
    }

    // Check rate limiting
    if (!middlewareContent.includes('rateLimit')) {
      issues.push('Rate limiting not configured');
    }

    // Check CSP
    if (!middlewareContent.includes('Content-Security-Policy')) {
      issues.push('Content Security Policy not configured');
    }

    if (issues.length > 0) {
      this.log(`Security configuration issues found:`, 'warning');
      issues.forEach(issue => this.log(`  - ${issue}`, 'warning'));
      return false;
    }

    this.log('Security configurations look good', 'success');
    return true;
  }

  generateReport() {
    const reportPath = path.join(__dirname, 'security-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        npm: execSync('npm --version', { encoding: 'utf8' }).trim(),
        platform: process.platform
      },
      results: this.results,
      recommendations: []
    };

    // Add recommendations based on results
    if (this.results.dependencies === 'FAILED') {
      report.recommendations.push('Run "npm audit fix" to fix vulnerabilities');
      report.recommendations.push('Review and update dependencies regularly');
    }

    if (this.results.penetrationTests === 'FAILED') {
      report.recommendations.push('Review penetration test report for specific vulnerabilities');
      report.recommendations.push('Implement fixes for identified security issues');
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Report saved to: ${reportPath}`, 'info');

    return report;
  }

  async run() {
    this.log('🔒 Starting Comprehensive Security Tests\n');

    const startTime = Date.now();
    let hasFailures = false;

    try {
      // Check configurations
      await this.checkSecurityConfigs();

      // Run tests
      try {
        await this.runUnitTests();
      } catch (error) {
        hasFailures = true;
      }

      try {
        await this.checkDependencies();
      } catch (error) {
        hasFailures = true;
      }

      try {
        await this.runPenetrationTests();
      } catch (error) {
        hasFailures = true;
      }

      // Determine overall result
      const allPassed = Object.values(this.results)
        .filter(r => r !== null && r !== 'PENDING')
        .every(r => r === 'PASSED');

      this.results.overall = allPassed ? 'PASSED' : 'FAILED';

    } catch (error) {
      this.log(`Unexpected error: ${error.message}`, 'error');
      this.results.overall = 'ERROR';
      hasFailures = true;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const report = this.generateReport();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Duration: ${duration}s`);
    console.log(`Overall Result: ${this.results.overall}`);
    console.log('\nTest Results:');
    console.log(`  Unit Tests: ${this.results.unitTests || 'NOT RUN'}`);
    console.log(`  Dependencies: ${this.results.dependencies || 'NOT RUN'}`);
    console.log(`  Penetration Tests: ${this.results.penetrationTests || 'NOT RUN'}`);

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    console.log('='.repeat(60));

    // Exit with appropriate code
    process.exit(hasFailures ? 1 : 0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const runner = new SecurityTestRunner();

if (args.includes('--help')) {
  console.log(`
Security Test Runner

Usage: node run-security-tests.js [options]

Options:
  --help          Show this help message
  --unit-only     Run only unit tests
  --pen-only      Run only penetration tests
  --deps-only     Check only dependencies

Without options, all tests will be run.
  `);
  process.exit(0);
}

// Run specific tests based on arguments
if (args.includes('--unit-only')) {
  runner.runUnitTests().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (args.includes('--pen-only')) {
  runner.runPenetrationTests().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (args.includes('--deps-only')) {
  runner.checkDependencies().then(() => process.exit(0)).catch(() => process.exit(1));
} else {
  // Run all tests
  runner.run();
}