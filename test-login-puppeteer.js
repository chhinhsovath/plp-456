const puppeteer = require('puppeteer');

async function testLogin() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/1-login-page.png', fullPage: true });
    
    console.log('2. Filling login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'admin@openplp.com');
    await page.type('input[type="password"]', 'admin123');
    await page.screenshot({ path: 'screenshots/2-filled-form.png', fullPage: true });
    
    console.log('3. Clicking submit button...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 })
    ]);
    
    console.log('4. After login - Current URL:', page.url());
    await page.screenshot({ path: 'screenshots/3-after-login.png', fullPage: true });
    
    // Check cookies
    const cookies = await page.cookies();
    console.log('Cookies:', cookies);
    
    // Try to access dashboard directly
    console.log('5. Trying to access dashboard directly...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle0' });
    console.log('Dashboard URL after navigation:', page.url());
    await page.screenshot({ path: 'screenshots/4-dashboard-direct.png', fullPage: true });
    
    // Check for auth token in cookies
    const authToken = cookies.find(c => c.name === 'auth-token');
    console.log('Auth token found:', authToken ? 'Yes' : 'No');
    if (authToken) {
      console.log('Auth token details:', {
        value: authToken.value.substring(0, 20) + '...',
        httpOnly: authToken.httpOnly,
        secure: authToken.secure,
        sameSite: authToken.sameSite,
        path: authToken.path
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  }
  
  await browser.close();
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testLogin();