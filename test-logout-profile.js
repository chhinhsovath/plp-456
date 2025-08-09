// Test script to verify logout and profile badge functionality
const puppeteer = require('puppeteer');

async function testLogoutAndProfile() {
  console.log('Starting logout and profile badge test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
    
    // Login with admin credentials
    console.log('2. Logging in as admin...');
    await page.type('input[name="email"]', 'admin@plp456.com');
    await page.type('input[name="password"]', 'Admin@456');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('3. Successfully logged in, now on dashboard');
    
    // Check if profile badge is showing
    console.log('4. Checking profile badge...');
    const profileBadge = await page.evaluate(() => {
      const badges = document.querySelectorAll('.rounded-full');
      for (let badge of badges) {
        if (badge.textContent && badge.textContent.trim().length <= 2) {
          return badge.textContent.trim();
        }
      }
      return null;
    });
    
    if (profileBadge) {
      console.log(`✅ Profile badge found with initials: "${profileBadge}"`);
    } else {
      console.log('❌ Profile badge not found');
    }
    
    // Click on profile menu
    console.log('5. Clicking on profile menu...');
    await page.evaluate(() => {
      const profileButtons = document.querySelectorAll('button');
      for (let btn of profileButtons) {
        const badge = btn.querySelector('.rounded-full');
        if (badge && badge.textContent && badge.textContent.trim().length <= 2) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    await page.waitForTimeout(1000);
    
    // Check if logout button is visible
    console.log('6. Checking for logout button...');
    const logoutButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent && (btn.textContent.includes('Logout') || btn.textContent.includes('ចាកចេញ'))) {
          return btn.textContent.trim();
        }
      }
      return null;
    });
    
    if (logoutButton) {
      console.log(`✅ Logout button found: "${logoutButton}"`);
      
      // Click logout
      console.log('7. Clicking logout button...');
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent && (btn.textContent.includes('Logout') || btn.textContent.includes('ចាកចេញ'))) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      
      // Wait for redirect to login page
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log('✅ Successfully logged out and redirected to login page');
      } else {
        console.log(`❌ Unexpected redirect after logout: ${currentUrl}`);
      }
    } else {
      console.log('❌ Logout button not found');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLogoutAndProfile();