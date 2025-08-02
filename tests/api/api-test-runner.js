const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class APITestRunner {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.API_BASE_URL || 'http://localhost:3000';
    this.results = [];
    this.token = null;
    this.evidenceDir = path.join(__dirname, 'evidence');
  }

  // Initialize test environment
  async init() {
    await fs.mkdir(this.evidenceDir, { recursive: true });
    console.log(`🧪 API Test Runner initialized`);
    console.log(`📍 Base URL: ${this.baseURL}`);
  }

  // Login and get token
  async authenticate(username = 'admin_test', password = 'Test@123') {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        username,
        password
      });
      
      this.token = response.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      console.log(`✅ Authenticated as ${username}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Authentication failed: ${error.message}`);
      throw error;
    }
  }

  // Generic API test method
  async testEndpoint(config) {
    const {
      name,
      method,
      endpoint,
      data = null,
      params = {},
      headers = {},
      expectedStatus = 200,
      validateResponse = null,
      description = ''
    } = config;

    const startTime = Date.now();
    let result = {
      name,
      endpoint,
      method,
      description,
      success: false,
      duration: 0,
      request: { method, endpoint, data, params },
      response: null,
      error: null
    };

    try {
      console.log(`\n🔄 Testing: ${name}`);
      console.log(`   ${method} ${endpoint}`);
      
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        params,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });

      result.response = {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      };

      // Check status code
      if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
      }

      // Custom validation
      if (validateResponse) {
        validateResponse(response.data);
      }

      result.success = true;
      console.log(`   ✅ Success (${response.status})`);

    } catch (error) {
      result.error = {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      };
      console.log(`   ❌ Failed: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);
    return result;
  }

  // Test CRUD operations for a resource
  async testCRUD(resourceName, config) {
    console.log(`\n📦 Testing CRUD for: ${resourceName}`);
    
    const results = {
      create: null,
      read: null,
      update: null,
      delete: null,
      list: null
    };

    let createdId = null;

    // CREATE
    if (config.create) {
      results.create = await this.testEndpoint({
        name: `${resourceName} - Create`,
        method: 'POST',
        endpoint: config.endpoint,
        data: config.create.data,
        expectedStatus: config.create.expectedStatus || 201,
        validateResponse: (data) => {
          if (!data.id) throw new Error('No ID returned');
          createdId = data.id;
          if (config.create.validate) config.create.validate(data);
        }
      });
    }

    // LIST
    if (config.list) {
      results.list = await this.testEndpoint({
        name: `${resourceName} - List`,
        method: 'GET',
        endpoint: config.endpoint,
        params: config.list.params || {},
        expectedStatus: 200,
        validateResponse: (data) => {
          if (!Array.isArray(data)) throw new Error('Response is not an array');
          if (config.list.validate) config.list.validate(data);
        }
      });
    }

    // READ
    if (config.read && createdId) {
      results.read = await this.testEndpoint({
        name: `${resourceName} - Read`,
        method: 'GET',
        endpoint: `${config.endpoint}/${createdId}`,
        expectedStatus: 200,
        validateResponse: (data) => {
          if (data.id !== createdId) throw new Error('ID mismatch');
          if (config.read.validate) config.read.validate(data);
        }
      });
    }

    // UPDATE
    if (config.update && createdId) {
      results.update = await this.testEndpoint({
        name: `${resourceName} - Update`,
        method: 'PUT',
        endpoint: `${config.endpoint}/${createdId}`,
        data: config.update.data,
        expectedStatus: 200,
        validateResponse: config.update.validate
      });
    }

    // DELETE
    if (config.delete && createdId) {
      results.delete = await this.testEndpoint({
        name: `${resourceName} - Delete`,
        method: 'DELETE',
        endpoint: `${config.endpoint}/${createdId}`,
        expectedStatus: config.delete.expectedStatus || 200,
        validateResponse: config.delete.validate
      });
    }

    return results;
  }

  // Generate test report
  async generateReport() {
    const timestamp = new Date().toISOString();
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    const report = {
      timestamp,
      baseURL: this.baseURL,
      summary: {
        total: this.results.length,
        passed,
        failed,
        totalDuration,
        averageDuration: totalDuration / this.results.length
      },
      results: this.results
    };

    // Save JSON report
    const jsonFile = path.join(this.evidenceDir, `api-test-report-${Date.now()}.json`);
    await fs.writeFile(jsonFile, JSON.stringify(report, null, 2));

    // Generate HTML report
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>API Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #2196F3; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat { background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #333; }
    .stat-label { color: #666; margin-top: 5px; }
    .passed { color: #4caf50; }
    .failed { color: #f44336; }
    .test-result { margin: 10px 0; padding: 15px; border-left: 4px solid #ddd; background: #fafafa; }
    .test-result.success { border-color: #4caf50; }
    .test-result.failure { border-color: #f44336; background: #ffebee; }
    .test-header { display: flex; justify-content: space-between; align-items: center; }
    .test-name { font-weight: bold; }
    .test-status { padding: 5px 10px; border-radius: 3px; color: white; font-size: 0.9em; }
    .test-details { margin-top: 10px; font-size: 0.9em; color: #666; }
    .error-details { margin-top: 10px; padding: 10px; background: #ffcdd2; border-radius: 3px; color: #d32f2f; }
    .endpoint { font-family: monospace; background: #e3f2fd; padding: 2px 5px; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>API Test Report</h1>
      <p>Generated: ${new Date(timestamp).toLocaleString()}</p>
      <p>Base URL: ${this.baseURL}</p>
    </div>

    <div class="summary">
      <div class="stat">
        <div class="stat-value">${report.summary.total}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat">
        <div class="stat-value passed">${report.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value failed">${report.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value">${(report.summary.totalDuration / 1000).toFixed(2)}s</div>
        <div class="stat-label">Total Duration</div>
      </div>
    </div>

    <h2>Test Results</h2>
    ${this.results.map(result => `
      <div class="test-result ${result.success ? 'success' : 'failure'}">
        <div class="test-header">
          <div>
            <div class="test-name">${result.name}</div>
            <div class="test-details">
              <span class="endpoint">${result.method} ${result.endpoint}</span>
              <span> • ${result.duration}ms</span>
            </div>
          </div>
          <div class="test-status" style="background: ${result.success ? '#4caf50' : '#f44336'}">
            ${result.success ? 'PASSED' : 'FAILED'}
          </div>
        </div>
        ${result.error ? `
          <div class="error-details">
            <strong>Error:</strong> ${result.error.message}
            ${result.error.response ? `<pre>${JSON.stringify(result.error.response, null, 2)}</pre>` : ''}
          </div>
        ` : ''}
        ${result.description ? `<div class="test-details">${result.description}</div>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;

    const htmlFile = path.join(this.evidenceDir, `api-test-report-${Date.now()}.html`);
    await fs.writeFile(htmlFile, html);

    console.log(`\n📊 Test Summary:`);
    console.log(`   Total: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`\n📁 Reports saved to:`);
    console.log(`   JSON: ${jsonFile}`);
    console.log(`   HTML: ${htmlFile}`);

    return { jsonFile, htmlFile, report };
  }
}

module.exports = APITestRunner;