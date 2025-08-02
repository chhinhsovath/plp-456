const APITestRunner = require('./api-test-runner');

async function runAllTests() {
  const runner = new APITestRunner();
  await runner.init();

  try {
    // Authenticate first
    await runner.authenticate('admin_test', 'Test@123');

    // Test Auth Endpoints
    console.log('\n🔐 Testing Authentication Endpoints');
    
    await runner.testEndpoint({
      name: 'Auth - Login',
      method: 'POST',
      endpoint: '/api/auth/login',
      data: {
        username: 'teacher_test',
        password: 'Test@123'
      },
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!data.token) throw new Error('No token in response');
        if (!data.user) throw new Error('No user data in response');
      }
    });

    await runner.testEndpoint({
      name: 'Auth - Get Session',
      method: 'GET',
      endpoint: '/api/auth/session',
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!data.user) throw new Error('No user in session');
        if (!data.user.id) throw new Error('No user ID in session');
      }
    });

    await runner.testEndpoint({
      name: 'Auth - Invalid Login',
      method: 'POST',
      endpoint: '/api/auth/login',
      data: {
        username: 'invalid_user',
        password: 'wrong_password'
      },
      expectedStatus: 401
    });

    // Test Observation CRUD
    console.log('\n📋 Testing Observation Endpoints');
    
    const observationCrud = await runner.testCRUD('Observations', {
      endpoint: '/api/mentoring/observations',
      create: {
        data: {
          teacherId: 'teacher_123',
          mentorId: 'mentor_456',
          date: '2024-01-15',
          type: 'classroom',
          subject: 'mathematics',
          gradeLevel: '5',
          status: 'scheduled',
          notes: 'Test observation'
        },
        expectedStatus: 201,
        validate: (data) => {
          if (!data.id) throw new Error('No observation ID returned');
          if (data.status !== 'scheduled') throw new Error('Status not set correctly');
        }
      },
      list: {
        params: { limit: 10, status: 'scheduled' },
        validate: (data) => {
          if (data.length === 0) console.warn('No observations found');
        }
      },
      read: {
        validate: (data) => {
          if (!data.teacher) throw new Error('No teacher data included');
          if (!data.mentor) throw new Error('No mentor data included');
        }
      },
      update: {
        data: {
          status: 'completed',
          scores: {
            teachingMethods: 4,
            studentEngagement: 5,
            classroomManagement: 4,
            learningOutcomes: 3
          },
          feedback: 'Great observation session'
        },
        validate: (data) => {
          if (data.status !== 'completed') throw new Error('Status not updated');
          if (!data.scores) throw new Error('Scores not saved');
        }
      },
      delete: {
        expectedStatus: 200
      }
    });

    // Test Mentoring Sessions
    console.log('\n👥 Testing Mentoring Session Endpoints');
    
    await runner.testCRUD('Mentoring Sessions', {
      endpoint: '/api/mentoring/sessions',
      create: {
        data: {
          mentorId: 'mentor_456',
          menteeIds: ['teacher_123', 'teacher_789'],
          scheduledDate: '2024-01-20T10:00:00Z',
          duration: 60,
          type: 'group',
          agenda: 'Discuss teaching strategies',
          location: 'Conference Room A'
        },
        validate: (data) => {
          if (!data.id) throw new Error('No session ID returned');
          if (data.menteeIds.length !== 2) throw new Error('Mentees not saved correctly');
        }
      },
      list: {
        params: { 
          mentorId: 'mentor_456',
          from: '2024-01-01',
          to: '2024-01-31'
        }
      },
      update: {
        data: {
          status: 'completed',
          actualDuration: 75,
          notes: 'Productive session, covered all agenda items',
          attendance: ['teacher_123']
        }
      }
    });

    // Test Resources
    console.log('\n📚 Testing Resource Endpoints');
    
    await runner.testCRUD('Resources', {
      endpoint: '/api/mentoring/resources',
      create: {
        data: {
          title: 'Effective Teaching Strategies',
          description: 'A comprehensive guide to modern teaching methods',
          type: 'document',
          subject: 'pedagogy',
          gradeLevel: ['4', '5', '6'],
          language: 'en',
          fileUrl: 'https://example.com/resource.pdf',
          tags: ['teaching', 'strategies', 'classroom']
        }
      },
      list: {
        params: {
          subject: 'pedagogy',
          type: 'document'
        }
      }
    });

    // Test Resource Tracking
    await runner.testEndpoint({
      name: 'Resources - Track Usage',
      method: 'POST',
      endpoint: '/api/mentoring/resources/123/track',
      data: {
        action: 'view',
        duration: 300
      },
      expectedStatus: 200
    });

    // Test Favorites
    await runner.testEndpoint({
      name: 'Resources - Add to Favorites',
      method: 'POST',
      endpoint: '/api/mentoring/resources/favorites',
      data: {
        resourceId: '123'
      },
      expectedStatus: 200
    });

    await runner.testEndpoint({
      name: 'Resources - Get Favorites',
      method: 'GET',
      endpoint: '/api/mentoring/resources/favorites',
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!Array.isArray(data)) throw new Error('Favorites should be an array');
      }
    });

    // Test Feedback
    console.log('\n💬 Testing Feedback Endpoints');
    
    await runner.testCRUD('Feedback', {
      endpoint: '/api/mentoring/feedback',
      create: {
        data: {
          observationId: 'obs_123',
          fromUserId: 'teacher_123',
          toUserId: 'mentor_456',
          type: 'observation_feedback',
          rating: 5,
          comment: 'Very helpful observation and feedback'
        }
      },
      list: {
        params: {
          userId: 'teacher_123',
          type: 'observation_feedback'
        }
      }
    });

    // Test Progress Reports
    console.log('\n📊 Testing Progress Report Endpoints');
    
    await runner.testEndpoint({
      name: 'Progress Reports - Get Teacher Progress',
      method: 'GET',
      endpoint: '/api/mentoring/progress-reports',
      params: {
        teacherId: 'teacher_123',
        from: '2024-01-01',
        to: '2024-01-31'
      },
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!data.summary) throw new Error('No summary in progress report');
        if (!data.observations) throw new Error('No observations data');
        if (!data.improvements) throw new Error('No improvements data');
      }
    });

    // Test Badges & Certificates
    console.log('\n🏆 Testing Badges & Certificates');
    
    await runner.testEndpoint({
      name: 'Badges - Get User Badges',
      method: 'GET',
      endpoint: '/api/mentoring/badges',
      params: { userId: 'teacher_123' },
      expectedStatus: 200
    });

    await runner.testEndpoint({
      name: 'Certificates - Generate Certificate',
      method: 'POST',
      endpoint: '/api/mentoring/certificates',
      data: {
        userId: 'teacher_123',
        type: 'completion',
        courseId: 'course_456',
        completionDate: '2024-01-15'
      },
      expectedStatus: 201
    });

    // Test Geographic Data
    console.log('\n🗺️ Testing Geographic Endpoints');
    
    await runner.testEndpoint({
      name: 'Geographic - Get Provinces',
      method: 'GET',
      endpoint: '/api/geographic/provinces',
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!Array.isArray(data)) throw new Error('Provinces should be an array');
        if (data.length === 0) throw new Error('No provinces returned');
      }
    });

    await runner.testEndpoint({
      name: 'Geographic - Get Districts',
      method: 'GET',
      endpoint: '/api/geographic/districts',
      params: { provinceId: '1' },
      expectedStatus: 200
    });

    // Test AI Suggestions
    console.log('\n🤖 Testing AI Endpoints');
    
    await runner.testEndpoint({
      name: 'AI - Get Teaching Suggestions',
      method: 'POST',
      endpoint: '/api/ai/suggestions',
      data: {
        observationId: 'obs_123',
        context: {
          subject: 'mathematics',
          gradeLevel: '5',
          challenges: ['student_engagement', 'time_management']
        }
      },
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!data.suggestions) throw new Error('No suggestions returned');
        if (!Array.isArray(data.suggestions)) throw new Error('Suggestions should be an array');
      }
    });

    // Test Notification Endpoints
    console.log('\n🔔 Testing Notification Endpoints');
    
    await runner.testEndpoint({
      name: 'Notifications - Send Test Notification',
      method: 'POST',
      endpoint: '/api/cron/mentoring-notifications',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET || 'test-secret'
      },
      expectedStatus: 200
    });

    // Test Error Handling
    console.log('\n⚠️ Testing Error Handling');
    
    await runner.testEndpoint({
      name: 'Error - 404 Not Found',
      method: 'GET',
      endpoint: '/api/non-existent-endpoint',
      expectedStatus: 404
    });

    await runner.testEndpoint({
      name: 'Error - Invalid JSON',
      method: 'POST',
      endpoint: '/api/mentoring/observations',
      data: 'invalid-json-string',
      headers: {
        'Content-Type': 'text/plain'
      },
      expectedStatus: 400
    });

    await runner.testEndpoint({
      name: 'Error - Missing Required Fields',
      method: 'POST',
      endpoint: '/api/mentoring/observations',
      data: {
        // Missing required fields
        notes: 'Test without required fields'
      },
      expectedStatus: 400
    });

    // Test Pagination
    console.log('\n📄 Testing Pagination');
    
    await runner.testEndpoint({
      name: 'Pagination - First Page',
      method: 'GET',
      endpoint: '/api/mentoring/observations',
      params: {
        page: 1,
        limit: 10
      },
      expectedStatus: 200,
      validateResponse: (data) => {
        if (!data.items) throw new Error('No items in paginated response');
        if (!data.meta) throw new Error('No meta information');
        if (data.items.length > 10) throw new Error('Limit not respected');
      }
    });

    // Test Filtering and Sorting
    console.log('\n🔍 Testing Filtering & Sorting');
    
    await runner.testEndpoint({
      name: 'Filter & Sort - Observations',
      method: 'GET',
      endpoint: '/api/mentoring/observations',
      params: {
        status: 'completed',
        from: '2024-01-01',
        to: '2024-01-31',
        sortBy: 'date',
        sortOrder: 'desc'
      },
      expectedStatus: 200
    });

    // Test Search
    console.log('\n🔎 Testing Search Functionality');
    
    await runner.testEndpoint({
      name: 'Search - Resources',
      method: 'GET',
      endpoint: '/api/mentoring/resources',
      params: {
        q: 'teaching strategies',
        type: 'document',
        language: 'en'
      },
      expectedStatus: 200
    });

    // Generate final report
    await runner.generateReport();

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    await runner.generateReport();
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);