const fetch = require('node-fetch');

// Test configuration
const API_BASE = 'http://localhost:3000/api';
const AUTH_TOKEN = 'your-auth-token'; // Replace with actual token if needed

// Sample observation data for different grades
const testObservations = {
  grade1: {
    observationData: {
      id: 'test-grade-1',
      nameOfTeacher: 'Teacher A',
      subject: 'Mathematics',
      school: 'Test School',
      grade: '1',
      evaluationData: {
        indicator_1: 'yes',
        indicator_2: 'no',
        indicator_3: 'some_practice',
        indicator_4: 'yes',
        indicator_5: 'no'
      },
      evaluationRecords: [],
      generalNotes: 'Grade 1 test observation'
    },
    language: 'km'
  },
  grade3: {
    observationData: {
      id: 'test-grade-3',
      nameOfTeacher: 'Teacher B',
      subject: 'Science',
      school: 'Test School',
      grade: '3',
      evaluationData: {
        indicator_1: 'yes',
        indicator_2: 'yes',
        indicator_3: 'no',
        indicator_4: 'some_practice',
        indicator_5: 'yes'
      },
      evaluationRecords: [],
      generalNotes: 'Grade 3 test observation'
    },
    language: 'km'
  },
  grade4: {
    observationData: {
      id: 'test-grade-4',
      nameOfTeacher: 'Teacher C',
      subject: 'English',
      school: 'Test School',
      grade: '4',
      evaluationData: {
        indicator_1: 'no',
        indicator_2: 'yes',
        indicator_3: 'yes',
        indicator_4: 'yes',
        indicator_5: 'some_practice'
      },
      evaluationRecords: [],
      generalNotes: 'Grade 4 test observation'
    },
    language: 'km'
  },
  grade6: {
    observationData: {
      id: 'test-grade-6',
      nameOfTeacher: 'Teacher D',
      subject: 'History',
      school: 'Test School',
      grade: '6',
      evaluationData: {
        indicator_1: 'yes',
        indicator_2: 'yes',
        indicator_3: 'yes',
        indicator_4: 'no',
        indicator_5: 'yes'
      },
      evaluationRecords: [],
      generalNotes: 'Grade 6 test observation'
    },
    language: 'km'
  }
};

async function testAIAnalysis(testName, testData) {
  console.log(`\n=== Testing ${testName} ===`);
  console.log(`Grade: ${testData.observationData.grade}`);
  console.log(`Subject: ${testData.observationData.subject}`);
  
  try {
    const response = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        // 'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API Error (${response.status}):`, error);
      return;
    }

    const result = await response.json();
    
    console.log('\n📊 Analysis Results:');
    console.log(`- Overall Score: ${result.overallScore}/10`);
    console.log(`- Performance Level: ${result.performanceLevel}`);
    
    // Check if strengths contain grade-appropriate field references
    console.log('\n💪 Strengths:');
    if (result.strengths && Array.isArray(result.strengths)) {
      result.strengths.forEach((strength, idx) => {
        console.log(`  ${idx + 1}. ${strength}`);
      });
    }
    
    console.log('\n🔧 Areas for Improvement:');
    if (result.areasForImprovement && Array.isArray(result.areasForImprovement)) {
      result.areasForImprovement.forEach((area, idx) => {
        console.log(`  ${idx + 1}. ${area}`);
      });
    }
    
    console.log('\n📝 Recommendations:');
    if (result.recommendations && Array.isArray(result.recommendations)) {
      result.recommendations.slice(0, 3).forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
      });
    }
    
    // Check if the response was cached
    if (result.cached) {
      console.log(`\n⚡ Result was cached (cached at: ${result.cachedAt})`);
    } else {
      console.log('\n🔄 Fresh analysis generated');
    }
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Analysis Field Mapping Tests');
  console.log('============================================');
  console.log('Testing grade-based field label mapping:');
  console.log('- Grades 1-3: Should use master_fields_123.indicator');
  console.log('- Grades 4-6: Should use master_fields.indicator_sub');
  
  // Test Grade 1 (should use master_fields_123)
  await testAIAnalysis('Grade 1 Analysis', testObservations.grade1);
  
  // Test Grade 3 (should use master_fields_123)
  await testAIAnalysis('Grade 3 Analysis', testObservations.grade3);
  
  // Test Grade 4 (should use master_fields)
  await testAIAnalysis('Grade 4 Analysis', testObservations.grade4);
  
  // Test Grade 6 (should use master_fields)
  await testAIAnalysis('Grade 6 Analysis', testObservations.grade6);
  
  console.log('\n============================================');
  console.log('🏁 All tests completed');
  console.log('\nVerification checklist:');
  console.log('1. Check that Grade 1 & 3 analyses reference fields from master_fields_123');
  console.log('2. Check that Grade 4 & 6 analyses reference fields from master_fields');
  console.log('3. Verify that cached results are returned on subsequent requests');
  console.log('4. Ensure field indicators appear correctly in strengths/improvements');
}

// Run the tests
runAllTests().catch(console.error);