const puppeteer = require('puppeteer');

async function testLoginAPI() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // Enable request interception
  await page.setRequestInterception(true);
  
  // Log all requests
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      console.log('Login request:', {
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
    request.continue();
  });
  
  // Log all responses
  page.on('response', async response => {
    if (response.url().includes('/api/auth/login')) {
      console.log('Login response:', {
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        body: await response.text()
      });
    }
  });
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    
    console.log('2. Waiting for form...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    console.log('3. Filling form...');
    await page.type('input[type="email"]', 'admin@openplp.com');
    await page.type('input[type="password"]', 'admin123');
    
    console.log('4. Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('5. Final URL:', page.url());
    
    // Check cookies after login
    const cookies = await page.cookies();
    console.log('6. Cookies after login:', cookies);
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('7. LocalStorage:', localStorage);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  // Keep browser open for inspection
  // await browser.close();
}

testLoginAPI();