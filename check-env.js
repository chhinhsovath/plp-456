#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log('🔍 Checking environment variables...\n');

// Check if .env.example exists
const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envExamplePath)) {
  console.log(`${colors.yellow}⚠ Warning: .env.example file not found${colors.reset}`);
  console.log('Create a .env.example file with all required environment variables');
  process.exit(0);
}

// Read .env.example
const envExample = fs.readFileSync(envExamplePath, 'utf8');
const requiredVars = [];

// Parse .env.example to get required variables
envExample.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [varName] = line.split('=');
    if (varName) {
      requiredVars.push(varName.trim());
    }
  }
});

// Load environment variables
const loadedEnvVars = new Set();

// Check .env file
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [varName] = line.split('=');
      if (varName) {
        loadedEnvVars.add(varName.trim());
      }
    }
  });
}

// Check .env.local file
if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  envLocalContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [varName] = line.split('=');
      if (varName) {
        loadedEnvVars.add(varName.trim());
      }
    }
  });
}

// Check process.env
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    loadedEnvVars.add(varName);
  }
});

// Report results
let hasErrors = false;
const missingVars = [];
const presentVars = [];

requiredVars.forEach(varName => {
  if (loadedEnvVars.has(varName) || process.env[varName]) {
    presentVars.push(varName);
  } else {
    missingVars.push(varName);
    hasErrors = true;
  }
});

// Display results
if (presentVars.length > 0) {
  console.log(`${colors.green}✓ Found ${presentVars.length} environment variables:${colors.reset}`);
  presentVars.forEach(v => console.log(`  - ${v}`));
}

if (missingVars.length > 0) {
  console.log(`\n${colors.red}✗ Missing ${missingVars.length} required environment variables:${colors.reset}`);
  missingVars.forEach(v => console.log(`  - ${v}`));
  console.log(`\n${colors.yellow}Please add these variables to your .env or .env.local file${colors.reset}`);
}

// Vercel-specific checks
console.log('\n🔧 Vercel-specific checks:');

// Check for Vercel environment
if (process.env.VERCEL) {
  console.log(`${colors.green}✓ Running in Vercel environment${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠ Not running in Vercel environment (this is normal for local development)${colors.reset}`);
}

// Check for common Vercel issues
const warnings = [];

// Check for hardcoded localhost URLs
const filesToCheck = [
  'next.config.js',
  'next.config.mjs',
  'src/lib/config.ts',
  'src/lib/config.js',
  'src/config.ts',
  'src/config.js'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('localhost:') || content.includes('127.0.0.1')) {
      warnings.push(`Found hardcoded localhost URL in ${file}`);
    }
  }
});

if (warnings.length > 0) {
  console.log(`\n${colors.yellow}⚠ Warnings:${colors.reset}`);
  warnings.forEach(w => console.log(`  - ${w}`));
}

// Final summary
console.log('\n' + '='.repeat(50));
if (!hasErrors && warnings.length === 0) {
  console.log(`${colors.green}✅ All environment checks passed!${colors.reset}`);
  process.exit(0);
} else if (hasErrors) {
  console.log(`${colors.red}❌ Environment check failed. Please fix the issues above.${colors.reset}`);
  process.exit(1);
} else {
  console.log(`${colors.yellow}⚠ Environment check passed with warnings.${colors.reset}`);
  process.exit(0);
}