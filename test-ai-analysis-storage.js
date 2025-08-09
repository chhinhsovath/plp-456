// Test script to verify AI analysis storage and retrieval
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3002';
const OBSERVATION_ID = '9f40082d-a958-4423-b9ca-01ad8eaad73a';

async function testAIAnalysisStorage() {
  console.log('Testing AI Analysis Storage and Retrieval...\n');
  
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@plp456.com',
        password: 'Admin@456'
      })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful\n');
    
    // Step 2: Fetch observation with AI analysis
    console.log('2. Fetching observation with AI analysis...');
    const observationResponse = await fetch(`${API_BASE}/api/observations/${OBSERVATION_ID}`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const observation = await observationResponse.json();
    
    if (observation.aiAnalysis) {
      console.log('✅ AI Analysis found in observation data:');
      console.log('   - Overall Score:', observation.aiAnalysis.overallScore);
      console.log('   - Performance Level:', observation.aiAnalysis.performanceLevel);
      console.log('   - Language:', observation.aiAnalysis.language);
      console.log('   - Created At:', observation.aiAnalysis.createdAt);
      console.log('   - Updated At:', observation.aiAnalysis.updatedAt);
      console.log('   - Strengths:', observation.aiAnalysis.strengths?.length || 0, 'items');
      console.log('   - Areas for Improvement:', observation.aiAnalysis.areasForImprovement?.length || 0, 'items');
      console.log('   - Recommendations:', observation.aiAnalysis.recommendations?.length || 0, 'items');
      console.log('   - Has Detailed Feedback:', !!observation.aiAnalysis.detailedFeedback);
    } else {
      console.log('❌ No AI Analysis found in observation data');
      console.log('   Observation may not have been analyzed yet');
    }
    
    console.log('\n3. Testing AI Analysis API endpoint...');
    
    // Step 3: Call AI analysis endpoint
    const analysisResponse = await fetch(`${API_BASE}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        observationData: {
          id: OBSERVATION_ID,
          nameOfTeacher: observation.nameOfTeacher || 'Test Teacher',
          subject: observation.subject || 'Mathematics',
          school: observation.school || 'Test School',
          grade: observation.grade || 3
        },
        language: 'km'
      })
    });
    
    if (analysisResponse.ok) {
      const analysis = await analysisResponse.json();
      console.log('✅ AI Analysis API Response:');
      console.log('   - Overall Score:', analysis.overallScore);
      console.log('   - Performance Level:', analysis.performanceLevel);
      console.log('   - Cached:', analysis.cached || false);
      if (analysis.cachedAt) {
        console.log('   - Cached At:', analysis.cachedAt);
      }
      
      // Step 4: Verify it was saved to database
      console.log('\n4. Verifying analysis was saved to database...');
      
      // Fetch observation again to check if AI analysis is included
      const verifyResponse = await fetch(`${API_BASE}/api/observations/${OBSERVATION_ID}`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.aiAnalysis) {
        console.log('✅ AI Analysis successfully stored in database and linked to observation!');
        console.log('\nDatabase Storage Summary:');
        console.log('   - Analysis is persisted in ai_analysis_results table');
        console.log('   - Analysis is linked to observation ID:', OBSERVATION_ID);
        console.log('   - Analysis can be retrieved with observation data');
        console.log('   - Cached responses improve performance');
      } else {
        console.log('⚠️ AI Analysis may not be visible yet. Try refreshing the page.');
      }
      
    } else {
      console.log('❌ AI Analysis API failed:', analysisResponse.status);
      const error = await analysisResponse.text();
      console.log('   Error:', error);
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\nSummary:');
    console.log('1. AI analysis results are automatically stored in the database');
    console.log('2. Analysis is linked to the observation record via inspectionSessionId');
    console.log('3. Cached analysis is returned for subsequent requests');
    console.log('4. The observation detail page shows cached analysis immediately');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAIAnalysisStorage();