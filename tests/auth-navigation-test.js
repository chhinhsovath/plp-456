const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runAuthNavigationTest() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Create evidence directory
  const evidenceDir = path.join(__dirname, 'evidence', new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(evidenceDir, { recursive: true });

  const results = [];

  // Enable detailed logging
  page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
  page.on('request', req => console.log('Request:', req.method(), req.url()));
  page.on('response', res => console.log('Response:', res.status(), res.url()));
  page.on('pageerror', error => console.error('Page error:', error.message));

  async function takeScreenshot(name) {
    const screenshotPath = path.join(evidenceDir, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  async function logResult(step, success, details = {}) {
    const result = {
      timestamp: new Date().toISOString(),
      step,
      success,
      ...details,
      url: page.url(),
      cookies: await page.cookies()
    };
    results.push(result);
    console.log(`\n${success ? '✅' : '❌'} ${step}`);
    if (details.error) console.error('Error:', details.error);
    console.log('Current URL:', result.url);
  }

  try {
    // Step 1: Navigate to login page
    console.log('\n🔍 Step 1: Navigate to login page');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give React time to fully render
    await takeScreenshot('01-login-page');
    await logResult('Navigate to login page', true);

    // Step 2: Fill and submit login form
    console.log('\n🔍 Step 2: Fill and submit login form');
    
    // Wait for the form inputs to be available
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 10000 });
    
    // Type credentials
    await page.type('input[type="email"], input[name="email"]', 'teacher@example.com');
    await page.type('input[type="password"], input[name="password"]', 'P@ssw0rd123');
    await takeScreenshot('02-login-filled');

    // Find and click submit button
    const submitButton = await page.$('button[type="submit"], form button');
    if (!submitButton) {
      throw new Error('Submit button not found');
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      submitButton.click()
    ]);

    await takeScreenshot('03-after-login');
    await logResult('Submit login form', true);

    // Step 3: Check if we're on dashboard
    console.log('\n🔍 Step 3: Check dashboard access');
    const dashboardUrl = page.url();
    if (!dashboardUrl.includes('/dashboard')) {
      await logResult('Dashboard access', false, { error: 'Not redirected to dashboard' });
      throw new Error('Login failed - not redirected to dashboard');
    }
    await logResult('Dashboard access', true);

    // Step 4: Test navigation to different pages
    console.log('\n🔍 Step 4: Test navigation to different pages');
    const menuItems = [
      { name: 'Observations', href: '/dashboard/observations' },
      { name: 'Evaluations', href: '/dashboard/evaluations' },
      { name: 'Mentoring', href: '/dashboard/mentoring' },
      { name: 'Analytics', href: '/dashboard/analytics' }
    ];

    for (const item of menuItems) {
      console.log(`\n📍 Testing navigation to ${item.name}...`);
      
      // Take screenshot before clicking
      await takeScreenshot(`04-before-${item.name.toLowerCase()}`);
      
      // Try to find and click the menu item
      const menuLink = await page.$(`a[href="${item.href}"]`);
      if (!menuLink) {
        await logResult(`Find ${item.name} menu item`, false, { error: 'Menu item not found' });
        continue;
      }

      // Click and see what happens
      try {
        await menuLink.click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for any redirects
        
        const currentUrl = page.url();
        await takeScreenshot(`05-after-${item.name.toLowerCase()}`);
        
        if (currentUrl.includes('/login')) {
          await logResult(`Navigate to ${item.name}`, false, { 
            error: 'Redirected to login page!',
            targetUrl: item.href,
            actualUrl: currentUrl
          });
          
          // Try to log in again
          console.log('🔄 Attempting to log in again...');
          await page.type('input[type="email"], input[name="email"]', 'teacher@example.com');
          await page.type('input[type="password"], input[name="password"]', 'P@ssw0rd123');
          const submitBtn = await page.$('button[type="submit"], form button');
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            submitBtn.click()
          ]);
        } else if (currentUrl.includes(item.href)) {
          await logResult(`Navigate to ${item.name}`, true);
        } else {
          await logResult(`Navigate to ${item.name}`, false, { 
            error: 'Unexpected URL',
            targetUrl: item.href,
            actualUrl: currentUrl
          });
        }
        
        // Go back to dashboard for next test
        if (!page.url().includes('/dashboard')) {
          await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        await logResult(`Navigate to ${item.name}`, false, { error: error.message });
      }
    }

    // Save results
    const reportPath = path.join(evidenceDir, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    // Generate HTML report
    const htmlReport = generateHTMLReport(results, evidenceDir);
    const htmlPath = path.join(evidenceDir, 'report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`\n📊 Test complete!`);
    console.log(`📁 Evidence saved to: ${evidenceDir}`);
    console.log(`📄 Open report: ${htmlPath}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await takeScreenshot('error-state');
  } finally {
    await browser.close();
  }
}

function generateHTMLReport(results, evidenceDir) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Auth Navigation Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .result { margin: 20px 0; padding: 15px; border-radius: 5px; border: 1px solid #ddd; }
    .success { background: #d4edda; border-color: #c3e6cb; }
    .failure { background: #f8d7da; border-color: #f5c6cb; }
    .screenshot { max-width: 100%; margin: 10px 0; border: 1px solid #ddd; }
    .details { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; font-size: 12px; }
    .cookies { background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 4px; font-size: 12px; }
    h1 { color: #333; }
    h3 { margin-top: 0; }
    .timestamp { color: #6c757d; font-size: 14px; }
    .error { color: #dc3545; font-weight: bold; }
    .url { color: #0066cc; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Authentication Navigation Test Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    <p>Total tests: ${results.length} | Passed: ${results.filter(r => r.success).length} | Failed: ${results.filter(r => !r.success).length}</p>
    
    ${results.map((result, index) => `
      <div class="result ${result.success ? 'success' : 'failure'}">
        <h3>${index + 1}. ${result.step}</h3>
        <p class="timestamp">${result.timestamp}</p>
        <p>Status: ${result.success ? '✅ Success' : '❌ Failed'}</p>
        <p>URL: <span class="url">${result.url}</span></p>
        
        ${result.error ? `<p class="error">Error: ${result.error}</p>` : ''}
        ${result.targetUrl ? `<p>Target URL: <span class="url">${result.targetUrl}</span></p>` : ''}
        ${result.actualUrl ? `<p>Actual URL: <span class="url">${result.actualUrl}</span></p>` : ''}
        
        ${result.cookies && result.cookies.length > 0 ? `
          <details>
            <summary>Cookies (${result.cookies.length})</summary>
            <div class="cookies">
              ${result.cookies.map(c => `${c.name}: ${c.value.substring(0, 20)}...`).join('<br>')}
            </div>
          </details>
        ` : ''}
      </div>
    `).join('')}
    
    <h2>Screenshots</h2>
    ${fs.readdirSync(evidenceDir).filter(f => f.endsWith('.png')).map(f => `
      <div>
        <h4>${f}</h4>
        <img class="screenshot" src="${f}" alt="${f}" />
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}

// Run the test
runAuthNavigationTest().catch(console.error);