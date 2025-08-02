const puppeteer = require('puppeteer');

async function testAuthFixed() {
  console.log('🔍 Testing authentication fixes...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to login
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Step 2: Login
    console.log('2️⃣ Logging in...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'teacher@example.com');
    await page.type('input[type="password"]', 'P@ssw0rd123');
    
    const loginButton = await page.$('button[type="submit"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      loginButton.click()
    ]);
    
    console.log('✅ Logged in successfully');
    console.log('Current URL:', page.url());
    
    // Get cookies after login
    const cookies = await page.cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token' || c.name === 'dev-auth-token');
    console.log('Auth cookie:', authCookie ? '✅ Found' : '❌ Not found');
    
    // Step 3: Test navigation to different pages
    const pages = [
      '/dashboard/observations',
      '/dashboard/evaluations', 
      '/dashboard/mentoring',
      '/dashboard/analytics'
    ];
    
    for (const pageUrl of pages) {
      console.log(`\n3️⃣ Testing navigation to ${pageUrl}...`);
      
      await page.goto(`http://localhost:3000${pageUrl}`, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log(`❌ FAILED: Redirected to login`);
      } else if (currentUrl.includes(pageUrl)) {
        console.log(`✅ SUCCESS: Stayed on ${pageUrl}`);
      } else {
        console.log(`⚠️  WARNING: Unexpected URL: ${currentUrl}`);
      }
    }
    
    // Step 4: Test direct API call
    console.log('\n4️⃣ Testing API session endpoint...');
    const sessionResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json()
      };
    });
    
    console.log('Session API response:', sessionResponse.ok ? '✅ Authenticated' : '❌ Not authenticated');
    if (sessionResponse.data.user) {
      console.log('User:', sessionResponse.data.user.email, `(${sessionResponse.data.user.role})`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFixed().then(() => {
  console.log('\n✅ Test completed');
}).catch(error => {
  console.error('\n❌ Test error:', error);
  process.exit(1);
});