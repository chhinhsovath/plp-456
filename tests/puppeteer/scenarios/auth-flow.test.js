const TestHelper = require('../utils/test-helper');

// Test: Login Flow
TestHelper.runTest('auth-login-flow', async (test) => {
  // Test login page accessibility
  await test.goto('/login');
  await test.screenshot('01-login-page');
  
  // Verify login form elements
  await test.assertExists('#username', 'Username field');
  await test.assertExists('#password', 'Password field');
  await test.assertExists('#login-button', 'Login button');
  
  // Test validation - empty fields
  await test.click('#login-button');
  await test.wait(500);
  await test.screenshot('02-validation-errors');
  
  // Test validation - invalid credentials
  await test.type('#username', 'invalid_user');
  await test.type('#password', 'wrong_password');
  await test.click('#login-button');
  await test.wait(1000);
  await test.screenshot('03-invalid-credentials');
  
  // Test successful login
  await test.type('#username', 'teacher_test');
  await test.type('#password', 'Test@123');
  await test.screenshot('04-credentials-entered');
  
  await Promise.all([
    test.page.waitForNavigation(),
    test.click('#login-button')
  ]);
  
  await test.screenshot('05-after-login');
  await test.assertUrl('/dashboard');
  
  // Verify user info is displayed
  await test.assertExists('.user-profile', 'User profile section');
  await test.assertText('.user-name', 'teacher_test');
  
  // Test logout
  await test.click('.user-menu');
  await test.wait(500);
  await test.screenshot('06-user-menu-open');
  
  await test.click('.logout-button');
  await test.wait(1000);
  await test.screenshot('07-after-logout');
  await test.assertUrl('/login');
});

// Test: Session Persistence
TestHelper.runTest('auth-session-persistence', async (test) => {
  // Login first
  await test.login('teacher');
  
  // Navigate directly to protected route
  await test.goto('/observations');
  await test.screenshot('01-protected-route-access');
  
  // Should stay on observations page
  await test.assertUrl('/observations');
  await test.assertExists('.observations-list', 'Observations list');
  
  // Refresh page and verify session persists
  await test.page.reload();
  await test.wait(1000);
  await test.screenshot('02-after-refresh');
  await test.assertUrl('/observations');
  
  // Test API call with session
  const response = await test.apiRequest('GET', '/api/auth/session');
  if (response.status !== 200) {
    throw new Error(`Session API failed: ${response.status}`);
  }
  
  test.evidence.log('Session data:', response.data);
});

// Test: Role-Based Access
TestHelper.runTest('auth-role-based-access', async (test) => {
  // Test as teacher - should not see admin features
  await test.login('teacher');
  await test.screenshot('01-teacher-dashboard');
  
  // Verify teacher-specific elements
  await test.assertExists('.my-observations', 'Teacher observations section');
  await test.assertExists('.my-resources', 'Teacher resources section');
  
  // Try to access admin route
  await test.goto('/admin/users');
  await test.wait(1000);
  await test.screenshot('02-teacher-admin-access-denied');
  
  // Should redirect or show error
  const url = test.page.url();
  if (!url.includes('/unauthorized') && !url.includes('/dashboard')) {
    throw new Error('Teacher was able to access admin route');
  }
  
  // Logout
  await test.goto('/dashboard');
  await test.click('.user-menu');
  await test.click('.logout-button');
  await test.wait(1000);
  
  // Test as admin
  await test.login('admin');
  await test.screenshot('03-admin-dashboard');
  
  // Verify admin-specific elements
  await test.assertExists('.system-stats', 'Admin system stats');
  await test.assertExists('.user-management-link', 'User management link');
  
  // Access admin route
  await test.goto('/admin/users');
  await test.wait(1000);
  await test.screenshot('04-admin-users-page');
  await test.assertUrl('/admin/users');
  await test.assertExists('.users-table', 'Users management table');
});

// Test: Telegram Authentication
TestHelper.runTest('auth-telegram-flow', async (test) => {
  await test.goto('/login');
  await test.screenshot('01-login-page-telegram');
  
  // Check if Telegram button exists
  await test.assertExists('.telegram-login-button', 'Telegram login button');
  
  // Click Telegram login
  await test.click('.telegram-login-button');
  await test.wait(2000);
  await test.screenshot('02-telegram-auth-initiated');
  
  // Note: Full Telegram auth flow requires actual Telegram interaction
  // This test verifies the button exists and initiates the flow
  test.evidence.log('Telegram auth flow initiated - manual verification needed');
});

// Test: Password Reset Flow
TestHelper.runTest('auth-password-reset', async (test) => {
  await test.goto('/login');
  
  // Click forgot password
  await test.assertExists('.forgot-password-link', 'Forgot password link');
  await test.click('.forgot-password-link');
  await test.wait(1000);
  await test.screenshot('01-forgot-password-page');
  
  // Enter email
  await test.assertExists('#reset-email', 'Email input for reset');
  await test.type('#reset-email', 'teacher@example.com');
  await test.screenshot('02-email-entered');
  
  // Submit reset request
  await test.click('#reset-submit');
  await test.wait(2000);
  await test.screenshot('03-reset-submitted');
  
  // Verify success message
  await test.assertExists('.reset-success', 'Password reset success message');
  await test.assertText('.reset-success', 'reset link has been sent');
});