const puppeteer = require('puppeteer');

async function testLogin() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Going to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/1-login-page.png' });
    
    console.log('2. Filling form...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@openplp.com');
    await page.type('input[type="password"]', 'admin123');
    await page.screenshot({ path: 'screenshots/2-filled-form.png' });
    
    console.log('3. Clicking login button...');
    await page.click('button[type="submit"]');
    
    console.log('4. Waiting for navigation...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) {
      console.log('No navigation occurred, checking current state...');
    }
    
    console.log('5. Current URL:', page.url());
    await page.screenshot({ path: 'screenshots/3-after-login.png' });
    
    // Check cookies
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token');
    console.log('6. Auth cookie found:', authCookie ? 'Yes' : 'No');
    
    // If still on login page, try to go to dashboard manually
    if (page.url().includes('/login')) {
      console.log('7. Still on login page, trying dashboard directly...');
      await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle0' });
      console.log('8. Dashboard URL:', page.url());
      await page.screenshot({ path: 'screenshots/4-dashboard.png' });
    }
    
    console.log('\nTest complete. Check screenshots in the screenshots folder.');
    
  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
  }
  
  // Keep browser open
  console.log('\nBrowser kept open for inspection. Press Ctrl+C to close.');
}

testLogin();