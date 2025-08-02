const TestHelper = require('../utils/test-helper');

// Test: Create Observation
TestHelper.runTest('observation-create-flow', async (test) => {
  // Login as mentor
  await test.login('mentor');
  
  // Navigate to observations
  await test.goto('/observations');
  await test.screenshot('01-observations-list');
  
  // Click create new observation
  await test.click('.create-observation-button');
  await test.wait(1000);
  await test.screenshot('02-new-observation-form');
  
  // Fill observation form
  await test.fillForm({
    '#teacher-select': { type: 'select', value: 'teacher_123' },
    '#observation-date': '2024-01-15',
    '#observation-type': { type: 'select', value: 'classroom' },
    '#subject': { type: 'select', value: 'mathematics' },
    '#grade-level': { type: 'select', value: '5' },
    '#initial-notes': 'Initial observation notes for testing'
  });
  
  await test.screenshot('03-form-filled');
  
  // Submit form
  await test.click('#submit-observation');
  await test.wait(2000);
  await test.screenshot('04-after-submit');
  
  // Verify success and redirect
  await test.assertExists('.success-message', 'Success message');
  await test.assertText('.observation-status', 'In Progress');
  
  // Capture the observation ID
  const observationId = await test.page.$eval('.observation-id', el => el.textContent);
  test.evidence.log(`Created observation ID: ${observationId}`);
});

// Test: Complete Observation with Scoring
TestHelper.runTest('observation-complete-flow', async (test) => {
  await test.login('mentor');
  
  // Go to observations and find in-progress one
  await test.goto('/observations');
  await test.click('.observation-row.in-progress');
  await test.wait(1000);
  await test.screenshot('01-observation-detail');
  
  // Fill evaluation scores
  await test.screenshot('02-evaluation-form');
  
  // Teaching Methods Score
  await test.click('[data-score="teaching-methods-4"]');
  await test.type('#teaching-methods-notes', 'Good use of interactive teaching methods');
  
  // Student Engagement Score
  await test.click('[data-score="student-engagement-5"]');
  await test.type('#student-engagement-notes', 'Excellent student participation');
  
  // Classroom Management Score
  await test.click('[data-score="classroom-management-4"]');
  await test.type('#classroom-management-notes', 'Well-organized classroom');
  
  // Learning Outcomes Score
  await test.click('[data-score="learning-outcomes-3"]');
  await test.type('#learning-outcomes-notes', 'Learning objectives partially met');
  
  await test.screenshot('03-scores-entered');
  
  // Add detailed feedback
  await test.type('#detailed-feedback', `
    Overall Assessment:
    - Strong teaching methodology
    - Excellent rapport with students
    - Could improve on time management
    - Recommend focusing on differentiated instruction
  `);
  
  // Upload evidence (simulate file upload)
  const uploadElement = await test.page.$('#evidence-upload');
  if (uploadElement) {
    test.evidence.log('File upload element found - would upload evidence here');
  }
  
  await test.screenshot('04-feedback-complete');
  
  // Submit completed observation
  await test.click('#complete-observation');
  await test.wait(2000);
  await test.screenshot('05-observation-completed');
  
  // Verify status change
  await test.assertText('.observation-status', 'Completed');
  await test.assertExists('.observation-scores', 'Scores section visible');
});

// Test: View Observation History
TestHelper.runTest('observation-history-view', async (test) => {
  await test.login('teacher');
  
  // Navigate to my observations
  await test.goto('/observations');
  await test.screenshot('01-teacher-observations');
  
  // Test filters
  await test.click('#filter-button');
  await test.wait(500);
  await test.screenshot('02-filters-open');
  
  // Apply date filter
  await test.type('#filter-date-from', '2024-01-01');
  await test.type('#filter-date-to', '2024-01-31');
  await test.click('#apply-filters');
  await test.wait(1000);
  await test.screenshot('03-filtered-results');
  
  // Click on an observation to view details
  await test.click('.observation-row:first-child');
  await test.wait(1000);
  await test.screenshot('04-observation-detail');
  
  // Verify all sections are visible
  await test.assertExists('.observation-info', 'Basic information');
  await test.assertExists('.observation-scores', 'Scores section');
  await test.assertExists('.observation-feedback', 'Feedback section');
  
  // Test print functionality
  await test.click('#print-observation');
  await test.wait(1000);
  test.evidence.log('Print dialog would open here');
  
  // Test export functionality
  await test.click('#export-observation');
  await test.wait(1000);
  test.evidence.log('Export would download here');
});

// Test: Observation Analytics
TestHelper.runTest('observation-analytics', async (test) => {
  await test.login('teacher');
  
  // Navigate to progress dashboard
  await test.goto('/progress');
  await test.screenshot('01-progress-dashboard');
  
  // Verify charts load
  await test.waitForSelector('.scores-chart', { timeout: 10000 });
  await test.screenshot('02-charts-loaded');
  
  // Check score trends
  await test.assertExists('.score-trend-chart', 'Score trend chart');
  await test.assertExists('.category-breakdown', 'Category breakdown');
  await test.assertExists('.improvement-areas', 'Improvement areas');
  
  // Interact with chart
  await test.click('.chart-period-selector [data-period="6months"]');
  await test.wait(1000);
  await test.screenshot('03-six-month-view');
  
  // Check detailed metrics
  await test.assertExists('.average-score', 'Average score displayed');
  await test.assertExists('.total-observations', 'Total observations count');
  await test.assertExists('.growth-percentage', 'Growth percentage');
  
  // Export report
  await test.click('#export-progress-report');
  await test.wait(1000);
  test.evidence.log('Progress report would export here');
});

// Test: Peer Observation
TestHelper.runTest('peer-observation-flow', async (test) => {
  await test.login('teacher');
  
  // Navigate to peer observations
  await test.goto('/observations/peer');
  await test.screenshot('01-peer-observations');
  
  // Request peer observation
  await test.click('#request-peer-observation');
  await test.wait(1000);
  await test.screenshot('02-peer-request-form');
  
  // Fill request form
  await test.fillForm({
    '#peer-teacher': { type: 'select', value: 'peer_teacher_456' },
    '#preferred-date': '2024-01-20',
    '#observation-focus': 'Classroom management techniques',
    '#specific-areas': 'Student engagement strategies during group work'
  });
  
  await test.screenshot('03-request-filled');
  
  // Submit request
  await test.click('#submit-peer-request');
  await test.wait(2000);
  await test.screenshot('04-request-submitted');
  
  // Verify request appears in list
  await test.assertExists('.peer-request.pending', 'Pending peer request');
  await test.assertText('.peer-request .peer-name', 'peer_teacher_456');
});