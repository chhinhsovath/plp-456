import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  timestamp: string;
  step: string;
  success: boolean;
  error?: string;
  screenshot?: string;
  logs: string[];
  cookies?: any[];
  localStorage?: any;
  sessionStorage?: any;
}

class AuthDebugger {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
  private screenshotDir: string;
  private logsDir: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.screenshotDir = path.join(__dirname, 'evidence', timestamp, 'screenshots');
    this.logsDir = path.join(__dirname, 'evidence', timestamp, 'logs');
    
    // Create directories
    fs.mkdirSync(this.screenshotDir, { recursive: true });
    fs.mkdirSync(this.logsDir, { recursive: true });
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      devtools: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // Enable console logging
    this.page.on('console', (msg: any) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      console.log('Browser console:', logEntry);
      if (this.results.length > 0) {
        this.results[this.results.length - 1].logs.push(logEntry);
      }
    });
    
    // Log network requests
    this.page.on('request', (request: any) => {
      const log = `[REQUEST] ${request.method()} ${request.url()}`;
      console.log(log);
      if (this.results.length > 0) {
        this.results[this.results.length - 1].logs.push(log);
      }
    });
    
    // Log network responses
    this.page.on('response', (response: any) => {
      const log = `[RESPONSE] ${response.status()} ${response.url()}`;
      console.log(log);
      if (this.results.length > 0) {
        this.results[this.results.length - 1].logs.push(log);
      }
    });
    
    // Log page errors
    this.page.on('pageerror', (error: any) => {
      const log = `[PAGE ERROR] ${error.message}`;
      console.error(log);
      if (this.results.length > 0) {
        this.results[this.results.length - 1].logs.push(log);
      }
    });
  }

  async captureState(stepName: string) {
    const screenshotPath = path.join(this.screenshotDir, `${stepName.replace(/\s+/g, '-')}.png`);
    await this.page!.screenshot({ path: screenshotPath, fullPage: true });
    
    // Capture cookies
    const cookies = await this.page!.cookies();
    
    // Capture localStorage and sessionStorage
    const storageData = await this.page!.evaluate(() => {
      const getStorage = (storage: Storage) => {
        const data: any = {};
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) {
            data[key] = storage.getItem(key);
          }
        }
        return data;
      };
      
      return {
        localStorage: getStorage(localStorage),
        sessionStorage: getStorage(sessionStorage)
      };
    });
    
    return {
      screenshot: screenshotPath,
      cookies,
      ...storageData
    };
  }

  async addResult(step: string, success: boolean, error?: string) {
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      step,
      success,
      error,
      logs: []
    };
    
    this.results.push(result);
    
    // Capture state
    const state = await this.captureState(step);
    result.screenshot = state.screenshot;
    result.cookies = state.cookies;
    result.localStorage = state.localStorage;
    result.sessionStorage = state.sessionStorage;
  }

  async testLogin() {
    try {
      console.log('🔍 Starting login test...');
      await this.addResult('Navigate to login page', true);
      
      await this.page!.goto('http://localhost:3000/login', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for login form
      await this.page!.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
      await this.addResult('Login page loaded', true);
      
      // Fill login form
      const emailInput = await this.page!.$('input[name="email"], input[type="email"]');
      const passwordInput = await this.page!.$('input[name="password"], input[type="password"]');
      
      if (!emailInput || !passwordInput) {
        throw new Error('Login form inputs not found');
      }
      
      await emailInput.type('teacher@example.com');
      await passwordInput.type('P@ssw0rd123');
      await this.addResult('Filled login form', true);
      
      // Submit form
      const submitButton = await this.page!.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
      if (!submitButton) {
        throw new Error('Submit button not found');
      }
      
      // Click and wait for navigation
      await Promise.all([
        this.page!.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
        submitButton.click()
      ]);
      
      await this.addResult('Submitted login form', true);
      
      // Check if we're on dashboard
      const currentUrl = this.page!.url();
      console.log('Current URL after login:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        await this.addResult('Successfully redirected to dashboard', true);
      } else {
        await this.addResult('Failed to redirect to dashboard', false, `Still on: ${currentUrl}`);
      }
      
      // Wait a bit for any async operations
      await this.page!.waitForTimeout(2000);
      
    } catch (error: any) {
      await this.addResult('Login test failed', false, error.message);
      throw error;
    }
  }

  async testNavigation() {
    try {
      console.log('🔍 Testing navigation...');
      
      // Test multiple menu items
      const menuItems = [
        { selector: 'a[href="/dashboard/observations"]', name: 'Observations' },
        { selector: 'a[href="/dashboard/evaluations"]', name: 'Evaluations' },
        { selector: 'a[href="/dashboard/mentoring"]', name: 'Mentoring' },
        { selector: 'a[href="/dashboard/analytics"]', name: 'Analytics' }
      ];
      
      for (const item of menuItems) {
        console.log(`\n📍 Testing navigation to ${item.name}...`);
        
        // Capture state before click
        await this.addResult(`Before clicking ${item.name}`, true);
        
        // Find and click menu item
        const menuLink = await this.page!.$(item.selector);
        if (!menuLink) {
          await this.addResult(`${item.name} menu item not found`, false);
          continue;
        }
        
        // Click and check what happens
        const navigationPromise = this.page!.waitForNavigation({ 
          waitUntil: 'networkidle0', 
          timeout: 10000 
        }).catch(() => null);
        
        await menuLink.click();
        
        // Wait for either navigation or timeout
        await Promise.race([
          navigationPromise,
          this.page!.waitForTimeout(3000)
        ]);
        
        const currentUrl = this.page!.url();
        console.log(`Current URL after clicking ${item.name}:`, currentUrl);
        
        if (currentUrl.includes('/login')) {
          await this.addResult(`Redirected to login after clicking ${item.name}`, false, `URL: ${currentUrl}`);
          
          // Log in again to continue testing
          await this.testLogin();
        } else if (currentUrl.includes(item.selector.match(/href="([^"]+)"/)?.[1] || '')) {
          await this.addResult(`Successfully navigated to ${item.name}`, true);
        } else {
          await this.addResult(`Navigation to ${item.name} resulted in unexpected URL`, false, `URL: ${currentUrl}`);
        }
        
        // Go back to dashboard for next test
        if (!currentUrl.includes('/dashboard') || currentUrl !== 'http://localhost:3000/dashboard') {
          await this.page!.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
          await this.page!.waitForTimeout(1000);
        }
      }
      
    } catch (error: any) {
      await this.addResult('Navigation test failed', false, error.message);
      throw error;
    }
  }

  async saveResults() {
    const reportPath = path.join(this.logsDir, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlPath = path.join(this.logsDir, 'test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`\n📊 Test report saved to: ${htmlPath}`);
    console.log(`📸 Screenshots saved to: ${this.screenshotDir}`);
  }

  generateHTMLReport(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Auth Debug Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .success { background-color: #d4edda; border-color: #c3e6cb; }
    .failure { background-color: #f8d7da; border-color: #f5c6cb; }
    .screenshot { max-width: 600px; margin: 10px 0; }
    .logs { background: #f0f0f0; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 12px; overflow-x: auto; }
    .storage { background: #e9ecef; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 12px; }
    h1 { color: #333; }
    h3 { margin-top: 20px; }
    .error { color: #dc3545; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Authentication Debug Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  ${this.results.map((result, index) => `
    <div class="result ${result.success ? 'success' : 'failure'}">
      <h3>${index + 1}. ${result.step}</h3>
      <p>Time: ${result.timestamp}</p>
      <p>Status: ${result.success ? '✅ Success' : '❌ Failed'}</p>
      ${result.error ? `<p class="error">Error: ${result.error}</p>` : ''}
      
      ${result.screenshot ? `
        <h4>Screenshot:</h4>
        <img class="screenshot" src="../screenshots/${path.basename(result.screenshot)}" alt="${result.step}" />
      ` : ''}
      
      ${result.logs.length > 0 ? `
        <h4>Console & Network Logs:</h4>
        <div class="logs">
          ${result.logs.join('<br>')}
        </div>
      ` : ''}
      
      ${result.cookies && result.cookies.length > 0 ? `
        <h4>Cookies:</h4>
        <div class="storage">
          ${JSON.stringify(result.cookies, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
        </div>
      ` : ''}
      
      ${result.localStorage && Object.keys(result.localStorage).length > 0 ? `
        <h4>LocalStorage:</h4>
        <div class="storage">
          ${JSON.stringify(result.localStorage, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
        </div>
      ` : ''}
      
      ${result.sessionStorage && Object.keys(result.sessionStorage).length > 0 ? `
        <h4>SessionStorage:</h4>
        <div class="storage">
          ${JSON.stringify(result.sessionStorage, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
    `;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.testLogin();
      await this.testNavigation();
      await this.saveResults();
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
const authDebugger = new AuthDebugger();
authDebugger.run().catch(console.error);