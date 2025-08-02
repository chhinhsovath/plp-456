const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const SCENARIOS_DIR = path.join(__dirname, 'scenarios');
const EVIDENCE_DIR = path.join(__dirname, 'evidence');
const PARALLEL_LIMIT = 3; // Number of tests to run in parallel

// Test runner class
class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  // Run a single test file
  async runTest(testFile) {
    return new Promise((resolve) => {
      const testName = path.basename(testFile, '.test.js');
      console.log(`\n🚀 Running test: ${testName}`);
      
      const startTime = Date.now();
      const child = spawn('node', [testFile], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data;
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        output += data;
        process.stderr.write(data);
      });
      
      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const result = {
          test: testName,
          file: testFile,
          success: code === 0,
          duration,
          output,
          exitCode: code
        };
        
        if (code === 0) {
          console.log(`✅ ${testName} passed (${duration}ms)`);
        } else {
          console.log(`❌ ${testName} failed (${duration}ms)`);
        }
        
        resolve(result);
      });
    });
  }

  // Run tests in batches
  async runTestsInBatches(testFiles) {
    const results = [];
    
    for (let i = 0; i < testFiles.length; i += PARALLEL_LIMIT) {
      const batch = testFiles.slice(i, i + PARALLEL_LIMIT);
      const batchResults = await Promise.all(
        batch.map(file => this.runTest(file))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // Find all test files
  async findTestFiles() {
    const files = await fs.readdir(SCENARIOS_DIR);
    return files
      .filter(f => f.endsWith('.test.js'))
      .map(f => path.join(SCENARIOS_DIR, f));
  }

  // Generate summary report
  async generateSummaryReport(results) {
    const totalDuration = Date.now() - this.startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed,
      failed,
      totalDuration,
      results: results.map(r => ({
        test: r.test,
        success: r.success,
        duration: r.duration,
        exitCode: r.exitCode
      }))
    };
    
    // Save JSON report
    const reportFile = path.join(
      EVIDENCE_DIR,
      `test-summary-${Date.now()}.json`
    );
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    // Generate HTML summary
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Summary Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #333; color: white; padding: 20px; border-radius: 5px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; }
    .stat-card h3 { margin: 0 0 10px 0; }
    .stat-value { font-size: 2em; font-weight: bold; }
    .passed { color: #4caf50; }
    .failed { color: #f44336; }
    .results { margin: 20px 0; }
    .result-row { display: flex; padding: 10px; border-bottom: 1px solid #ddd; }
    .result-row:hover { background: #f5f5f5; }
    .result-name { flex: 1; }
    .result-status { width: 100px; text-align: center; }
    .result-duration { width: 100px; text-align: right; }
    .success { background: #e8f5e9; color: #2e7d32; }
    .failure { background: #ffebee; color: #c62828; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Test Summary Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="summary">
    <div class="stat-card">
      <h3>Total Tests</h3>
      <div class="stat-value">${results.length}</div>
    </div>
    <div class="stat-card">
      <h3>Passed</h3>
      <div class="stat-value passed">${passed}</div>
    </div>
    <div class="stat-card">
      <h3>Failed</h3>
      <div class="stat-value failed">${failed}</div>
    </div>
    <div class="stat-card">
      <h3>Duration</h3>
      <div class="stat-value">${(totalDuration / 1000).toFixed(1)}s</div>
    </div>
  </div>

  <div class="results">
    <h2>Test Results</h2>
    ${results.map(r => `
      <div class="result-row">
        <div class="result-name">${r.test}</div>
        <div class="result-status ${r.success ? 'success' : 'failure'}">
          ${r.success ? 'PASSED' : 'FAILED'}
        </div>
        <div class="result-duration">${r.duration}ms</div>
      </div>
    `).join('')}
  </div>

  <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 5px;">
    <h3>Evidence Files</h3>
    <p>Check the evidence directory for detailed logs, screenshots, and individual test reports.</p>
    <p><code>${EVIDENCE_DIR}</code></p>
  </div>
</body>
</html>
    `;
    
    const htmlFile = path.join(
      EVIDENCE_DIR,
      `test-summary-${Date.now()}.html`
    );
    await fs.writeFile(htmlFile, htmlReport);
    
    return { reportFile, htmlFile };
  }

  // Main run method
  async run() {
    console.log('🧪 Puppeteer Test Runner');
    console.log('========================\n');
    
    // Ensure evidence directory exists
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    
    // Find test files
    const testFiles = await this.findTestFiles();
    console.log(`Found ${testFiles.length} test files\n`);
    
    // Run tests
    const results = await this.runTestsInBatches(testFiles);
    this.results = results;
    
    // Generate summary
    const { reportFile, htmlFile } = await this.generateSummaryReport(results);
    
    // Print summary
    console.log('\n========================');
    console.log('📊 Test Summary');
    console.log('========================');
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);
    console.log(`Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
    console.log(`\nReports saved to:`);
    console.log(`  JSON: ${reportFile}`);
    console.log(`  HTML: ${htmlFile}`);
    
    // Exit with appropriate code
    process.exit(results.some(r => !r.success) ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}

module.exports = TestRunner;