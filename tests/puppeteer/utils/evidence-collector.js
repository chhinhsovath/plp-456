const fs = require('fs').promises;
const path = require('path');
const config = require('../config/puppeteer.config');

class EvidenceCollector {
  constructor(testName) {
    this.testName = testName;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logs = [];
    this.errors = [];
  }

  // Initialize evidence directories
  async init() {
    const dirs = Object.values(config.evidencePaths);
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Capture screenshot with metadata
  async captureScreenshot(page, stepName) {
    const filename = `${this.testName}_${stepName}_${this.timestamp}.png`;
    const filepath = path.join(config.evidencePaths.screenshots, filename);
    
    try {
      await page.screenshot({ 
        path: filepath, 
        fullPage: true,
        captureBeyondViewport: true 
      });
      
      this.log(`Screenshot captured: ${filename}`);
      return filepath;
    } catch (error) {
      this.error(`Failed to capture screenshot: ${error.message}`);
      return null;
    }
  }

  // Capture browser console logs
  setupConsoleCapture(page) {
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString(),
        location: msg.location()
      };
      this.logs.push(logEntry);
    });

    page.on('pageerror', error => {
      this.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    page.on('requestfailed', request => {
      this.errors.push({
        type: 'requestfailed',
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      });
    });
  }

  // Capture network activity
  async setupNetworkCapture(page) {
    const networkLogs = [];
    
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    });

    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    });

    return networkLogs;
  }

  // Capture page metrics
  async captureMetrics(page) {
    const metrics = await page.metrics();
    const performance = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: timing.responseEnd - timing.navigationStart,
        resources: performance.getEntriesByType('resource').map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize
        }))
      };
    });

    return { metrics, performance };
  }

  // Capture element states
  async captureElementStates(page, selectors) {
    const states = {};
    
    for (const [name, selector] of Object.entries(selectors)) {
      try {
        const element = await page.$(selector);
        if (element) {
          states[name] = {
            visible: await element.isIntersectingViewport(),
            boundingBox: await element.boundingBox(),
            text: await page.$eval(selector, el => el.textContent),
            value: await page.$eval(selector, el => el.value || null),
            attributes: await page.$eval(selector, el => {
              const attrs = {};
              for (const attr of el.attributes) {
                attrs[attr.name] = attr.value;
              }
              return attrs;
            })
          };
        } else {
          states[name] = { exists: false };
        }
      } catch (error) {
        states[name] = { error: error.message };
      }
    }
    
    return states;
  }

  // Log helper
  log(message) {
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString()
    };
    this.logs.push(logEntry);
    console.log(`[${this.testName}] ${message}`);
  }

  // Error helper
  error(message, error = null) {
    const errorEntry = {
      level: 'error',
      message,
      error: error ? error.stack || error.message : null,
      timestamp: new Date().toISOString()
    };
    this.errors.push(errorEntry);
    console.error(`[${this.testName}] ERROR: ${message}`);
  }

  // Save all evidence to files
  async saveEvidence() {
    const evidenceFile = path.join(
      config.evidencePaths.logs,
      `${this.testName}_${this.timestamp}.json`
    );

    const evidence = {
      testName: this.testName,
      timestamp: this.timestamp,
      logs: this.logs,
      errors: this.errors,
      summary: {
        totalLogs: this.logs.length,
        totalErrors: this.errors.length,
        hasErrors: this.errors.length > 0
      }
    };

    await fs.writeFile(
      evidenceFile,
      JSON.stringify(evidence, null, 2)
    );

    return evidenceFile;
  }

  // Generate HTML report
  async generateHTMLReport(testResults) {
    const reportFile = path.join(
      config.evidencePaths.logs,
      `${this.testName}_report_${this.timestamp}.html`
    );

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report: ${this.testName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #333; color: white; padding: 20px; }
    .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
    .error { background: #ffebee; color: #c62828; padding: 10px; margin: 5px 0; }
    .success { background: #e8f5e9; color: #2e7d32; padding: 10px; margin: 5px 0; }
    .log { background: #f5f5f5; padding: 5px; margin: 2px 0; font-family: monospace; }
    .screenshot { max-width: 100%; margin: 10px 0; border: 1px solid #ddd; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .metric-card { background: #f5f5f5; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Test Report: ${this.testName}</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <div class="${this.errors.length > 0 ? 'error' : 'success'}">
      ${this.errors.length > 0 ? 
        `Test failed with ${this.errors.length} errors` : 
        'Test passed successfully'}
    </div>
  </div>

  ${testResults.metrics ? `
  <div class="section">
    <h2>Performance Metrics</h2>
    <div class="metrics">
      <div class="metric-card">
        <h4>DOM Content Loaded</h4>
        <p>${testResults.metrics.performance.domContentLoaded}ms</p>
      </div>
      <div class="metric-card">
        <h4>Page Load Complete</h4>
        <p>${testResults.metrics.performance.loadComplete}ms</p>
      </div>
      <div class="metric-card">
        <h4>JavaScript Heap</h4>
        <p>${(testResults.metrics.metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB</p>
      </div>
    </div>
  </div>
  ` : ''}

  ${this.errors.length > 0 ? `
  <div class="section">
    <h2>Errors</h2>
    ${this.errors.map(error => `
      <div class="error">
        <strong>${error.timestamp}</strong><br>
        ${error.message}<br>
        ${error.stack ? `<pre>${error.stack}</pre>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Console Logs</h2>
    ${this.logs.slice(-50).map(log => `
      <div class="log">
        [${log.timestamp}] ${log.level || log.type}: ${log.message || log.text}
      </div>
    `).join('')}
  </div>

  ${testResults.screenshots && testResults.screenshots.length > 0 ? `
  <div class="section">
    <h2>Screenshots</h2>
    ${testResults.screenshots.map(screenshot => `
      <div>
        <h4>${screenshot.step}</h4>
        <img class="screenshot" src="${screenshot.path}" alt="${screenshot.step}">
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
    `;

    await fs.writeFile(reportFile, html);
    return reportFile;
  }
}

module.exports = EvidenceCollector;