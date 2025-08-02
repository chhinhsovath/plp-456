const path = require('path');

module.exports = {
  // Browser launch options
  launchOptions: {
    headless: process.env.PUPPETEER_HEADLESS !== 'false',
    slowMo: process.env.PUPPETEER_SLOW_MO ? parseInt(process.env.PUPPETEER_SLOW_MO) : 0,
    devtools: process.env.PUPPETEER_DEVTOOLS === 'true',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  },

  // Test configuration
  testConfig: {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    timeout: 30000,
    retries: 2,
    screenshotOnFailure: true,
    videoOnFailure: false
  },

  // Evidence collection paths
  evidencePaths: {
    screenshots: path.join(__dirname, '../evidence/screenshots'),
    logs: path.join(__dirname, '../evidence/logs'),
    videos: path.join(__dirname, '../evidence/videos'),
    traces: path.join(__dirname, '../evidence/traces')
  },

  // Viewport sizes for responsive testing
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },

  // Test users for different roles
  testUsers: {
    teacher: {
      username: 'teacher_test',
      password: 'Test@123'
    },
    mentor: {
      username: 'mentor_test',
      password: 'Test@123'
    },
    admin: {
      username: 'admin_test',
      password: 'Test@123'
    }
  }
};