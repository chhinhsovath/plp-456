#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  // Add more required variables as needed
];

// Optional environment variables (warn if missing but don't fail)
const optionalEnvVars = [
  'GEMINI_API_KEY',
  'VERCEL_URL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TELEGRAM_BOT_TOKEN',
];

console.log('🔍 Validating environment variables...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('ℹ️  Found .env.example - you can copy it to .env.local and update the values');
    console.log('   Run: cp .env.example .env.local');
  }
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

let hasErrors = false;
const errors = [];
const warnings = [];

// Check required variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName] || process.env[varName].trim() === '') {
    hasErrors = true;
    errors.push(`❌ Missing required: ${varName}`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Check optional variables
optionalEnvVars.forEach(varName => {
  if (!process.env[varName] || process.env[varName].trim() === '') {
    warnings.push(`⚠️  Missing optional: ${varName}`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Validate DATABASE_URL format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    errors.push('❌ DATABASE_URL must be a valid PostgreSQL connection string');
    hasErrors = true;
  }
}

// Validate NEXTAUTH_URL format
if (process.env.NEXTAUTH_URL) {
  try {
    new URL(process.env.NEXTAUTH_URL);
  } catch (e) {
    errors.push('❌ NEXTAUTH_URL must be a valid URL');
    hasErrors = true;
  }
}

console.log('\n' + '='.repeat(50));

// Display results
if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(error => console.log(error));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(warning));
}

if (hasErrors) {
  console.log('\n❌ Environment validation failed!');
  console.log('Please fix the errors above before deploying to Vercel.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
  if (warnings.length > 0) {
    console.log('   (with some optional variables missing)');
  }
}