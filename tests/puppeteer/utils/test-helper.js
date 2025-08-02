const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const EvidenceCollector = require('./evidence-collector');

class TestHelper {
  constructor(testName) {
    this.testName = testName;
    this.browser = null;
    this.page = null;
    this.evidence = new EvidenceCollector(testName);
    this.screenshots = [];
  }

  // Initialize browser and page
  async setup() {
    await this.evidence.init();
    this.evidence.log('Setting up browser...');
    
    this.browser = await puppeteer.launch(config.launchOptions);
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport(config.viewports.desktop);
    
    // Setup evidence collection
    this.evidence.setupConsoleCapture(this.page);
    
    // Set default timeout
    this.page.setDefaultTimeout(config.testConfig.timeout);
    
    // Add request interception for auth
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      request.continue();
    });
    
    this.evidence.log('Browser setup complete');
  }

  // Navigate to a page with retry logic
  async goto(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${config.testConfig.baseUrl}${url}`;
    this.evidence.log(`Navigating to: ${fullUrl}`);
    
    let retries = config.testConfig.retries;
    while (retries > 0) {
      try {
        await this.page.goto(fullUrl, {
          waitUntil: 'networkidle2',
          ...options
        });
        this.evidence.log('Navigation successful');
        return;
      } catch (error) {
        retries--;
        this.evidence.error(`Navigation failed, retries left: ${retries}`, error);
        if (retries === 0) throw error;
        await this.wait(2000);
      }
    }
  }

  // Login helper
  async login(userType = 'teacher') {
    const user = config.testUsers[userType];
    if (!user) throw new Error(`Unknown user type: ${userType}`);
    
    this.evidence.log(`Logging in as ${userType}`);
    
    await this.goto('/login');
    await this.screenshot('login-page');
    
    // Fill login form
    await this.type('#username', user.username);
    await this.type('#password', user.password);
    await this.screenshot('login-filled');
    
    // Submit and wait for navigation
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      this.click('#login-button')
    ]);
    
    // Verify login success
    const currentUrl = this.page.url();
    if (currentUrl.includes('/dashboard')) {
      this.evidence.log('Login successful');
      await this.screenshot('dashboard-after-login');
    } else {
      throw new Error(`Login failed, current URL: ${currentUrl}`);
    }
  }

  // Type with clear
  async type(selector, text, options = {}) {
    await this.waitForSelector(selector);
    const element = await this.page.$(selector);
    await element.click({ clickCount: 3 }); // Select all
    await element.type(text, options);
    this.evidence.log(`Typed "${text}" into ${selector}`);
  }

  // Click with wait
  async click(selector, options = {}) {
    await this.waitForSelector(selector);
    await this.page.click(selector, options);
    this.evidence.log(`Clicked ${selector}`);
  }

  // Wait for selector with logging
  async waitForSelector(selector, options = {}) {
    this.evidence.log(`Waiting for selector: ${selector}`);
    try {
      await this.page.waitForSelector(selector, {
        visible: true,
        ...options
      });
      this.evidence.log(`Found selector: ${selector}`);
    } catch (error) {
      await this.screenshot(`selector-not-found-${selector.replace(/[^a-z0-9]/gi, '_')}`);
      throw error;
    }
  }

  // Wait helper
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  // Screenshot with evidence
  async screenshot(stepName) {
    const path = await this.evidence.captureScreenshot(this.page, stepName);
    if (path) {
      this.screenshots.push({ step: stepName, path });
    }
    return path;
  }

  // Assert element exists
  async assertExists(selector, message = '') {
    try {
      await this.waitForSelector(selector, { timeout: 5000 });
      this.evidence.log(`✓ Assertion passed: ${selector} exists ${message}`);
      return true;
    } catch (error) {
      await this.screenshot(`assertion-failed-${selector.replace(/[^a-z0-9]/gi, '_')}`);
      this.evidence.error(`✗ Assertion failed: ${selector} does not exist ${message}`);
      throw new Error(`Element not found: ${selector} ${message}`);
    }
  }

  // Assert text content
  async assertText(selector, expectedText, exact = false) {
    await this.waitForSelector(selector);
    const actualText = await this.page.$eval(selector, el => el.textContent.trim());
    
    const matches = exact ? 
      actualText === expectedText : 
      actualText.includes(expectedText);
    
    if (matches) {
      this.evidence.log(`✓ Text assertion passed: "${expectedText}" found in ${selector}`);
    } else {
      await this.screenshot('text-assertion-failed');
      this.evidence.error(`✗ Text assertion failed: Expected "${expectedText}", got "${actualText}"`);
      throw new Error(`Text mismatch: Expected "${expectedText}", got "${actualText}"`);
    }
  }

  // Assert URL
  async assertUrl(expectedUrl, exact = false) {
    const currentUrl = this.page.url();
    const matches = exact ? 
      currentUrl === expectedUrl : 
      currentUrl.includes(expectedUrl);
    
    if (matches) {
      this.evidence.log(`✓ URL assertion passed: ${expectedUrl}`);
    } else {
      this.evidence.error(`✗ URL assertion failed: Expected "${expectedUrl}", got "${currentUrl}"`);
      throw new Error(`URL mismatch: Expected "${expectedUrl}", got "${currentUrl}"`);
    }
  }

  // Fill form helper
  async fillForm(formData) {
    for (const [selector, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        await this.type(selector, value);
      } else if (typeof value === 'boolean') {
        const isChecked = await this.page.$eval(selector, el => el.checked);
        if (isChecked !== value) {
          await this.click(selector);
        }
      } else if (value.type === 'select') {
        await this.page.select(selector, value.value);
      }
    }
  }

  // API request helper
  async apiRequest(method, endpoint, data = null) {
    const response = await this.page.evaluate(async (method, endpoint, data) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(endpoint, options);
      const responseData = await response.json();
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      };
    }, method, endpoint, data);
    
    this.evidence.log(`API ${method} ${endpoint}: ${response.status} ${response.statusText}`);
    return response;
  }

  // Cleanup
  async cleanup() {
    this.evidence.log('Starting cleanup...');
    
    // Capture final metrics
    const metrics = await this.evidence.captureMetrics(this.page);
    
    // Save evidence
    const evidenceFile = await this.evidence.saveEvidence();
    
    // Generate HTML report
    const reportFile = await this.evidence.generateHTMLReport({
      metrics,
      screenshots: this.screenshots
    });
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
    }
    
    this.evidence.log(`Evidence saved to: ${evidenceFile}`);
    this.evidence.log(`Report saved to: ${reportFile}`);
    
    return {
      evidenceFile,
      reportFile,
      hasErrors: this.evidence.errors.length > 0
    };
  }

  // Run test with automatic setup/cleanup
  static async runTest(testName, testFunction) {
    const helper = new TestHelper(testName);
    let result = { success: false };
    
    try {
      await helper.setup();
      await testFunction(helper);
      result.success = true;
      console.log(`✓ Test passed: ${testName}`);
    } catch (error) {
      console.error(`✗ Test failed: ${testName}`);
      console.error(error);
      helper.evidence.error('Test failed', error);
      result.error = error;
    } finally {
      const cleanup = await helper.cleanup();
      result = { ...result, ...cleanup };
    }
    
    return result;
  }
}

module.exports = TestHelper;