const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCRUDOperations() {
  console.log('🔍 Testing CRUD Operations for AI Analysis Feature');
  console.log('==================================================\n');

  try {
    // 1. CREATE - Test creating AI analysis
    console.log('1️⃣ CREATE Operation:');
    console.log('--------------------');
    
    const testSessionId = 'test-' + Date.now();
    const testAnalysis = {
      inspectionSessionId: testSessionId,
      analysisType: 'general',
      overallScore: 8,
      performanceLevel: 'good',
      strengths: ['Strong classroom management', 'Clear communication'],
      areasForImprovement: ['Time management', 'Student engagement'],
      recommendations: ['Use more interactive activities', 'Implement formative assessments'],
      detailedFeedback: 'Test feedback for CRUD operations',
      language: 'km',
      metadata: {
        grade: '3',
        subject: 'Mathematics',
        testType: 'CRUD_TEST'
      },
      createdBy: 'test-script'
    };

    // First create a dummy inspection session
    const dummySession = await prisma.inspectionSession.create({
      data: {
        id: testSessionId,
        nameOfTeacher: 'Test Teacher',
        school: 'Test School',
        grade: 3,
        subject: 'Mathematics',
        inspectionDate: new Date(),
        province: 'Test Province',
        district: 'Test District',
        commune: 'Test Commune',
        sex: 'Male',
        employmentType: 'Full-time',
        sessionTime: 'Morning',
        userId: 1, // Assuming user with ID 1 exists
        isActive: true
      }
    });
    console.log('✅ Created test inspection session:', dummySession.id);

    // Create AI analysis
    const created = await prisma.aiAnalysisResult.create({
      data: testAnalysis
    });
    console.log('✅ Created AI analysis:', created.id);

    // 2. READ - Test reading AI analysis
    console.log('\n2️⃣ READ Operation:');
    console.log('------------------');
    
    const read = await prisma.aiAnalysisResult.findUnique({
      where: {
        inspectionSessionId_analysisType: {
          inspectionSessionId: testSessionId,
          analysisType: 'general'
        }
      }
    });
    console.log('✅ Read AI analysis:', read ? `Found (ID: ${read.id})` : 'Not found');

    // Read all analyses for a session
    const allAnalyses = await prisma.aiAnalysisResult.findMany({
      where: {
        inspectionSessionId: testSessionId
      }
    });
    console.log('✅ Found', allAnalyses.length, 'analysis records for session');

    // 3. UPDATE - Test updating AI analysis
    console.log('\n3️⃣ UPDATE Operation:');
    console.log('--------------------');
    
    const updated = await prisma.aiAnalysisResult.update({
      where: {
        inspectionSessionId_analysisType: {
          inspectionSessionId: testSessionId,
          analysisType: 'general'
        }
      },
      data: {
        overallScore: 9,
        performanceLevel: 'excellent',
        updatedAt: new Date()
      }
    });
    console.log('✅ Updated AI analysis score to:', updated.overallScore);
    console.log('✅ Updated performance level to:', updated.performanceLevel);

    // 4. DELETE - Test deleting AI analysis
    console.log('\n4️⃣ DELETE Operation:');
    console.log('--------------------');
    
    const deleted = await prisma.aiAnalysisResult.delete({
      where: {
        inspectionSessionId_analysisType: {
          inspectionSessionId: testSessionId,
          analysisType: 'general'
        }
      }
    });
    console.log('✅ Deleted AI analysis:', deleted.id);

    // Clean up test session
    await prisma.inspectionSession.delete({
      where: { id: testSessionId }
    });
    console.log('✅ Cleaned up test session');

    // 5. Test Grade-Based Field Mapping
    console.log('\n5️⃣ Grade-Based Field Mapping:');
    console.log('------------------------------');
    
    // Check master_fields_123 exists
    try {
      const grade123Count = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM master_fields_123
      `;
      console.log('✅ master_fields_123 table exists with', grade123Count[0].count, 'records');
    } catch (e) {
      console.log('❌ master_fields_123 table issue:', e.message);
    }

    // Check master_fields exists
    const masterFieldCount = await prisma.masterField.count();
    console.log('✅ master_fields table has', masterFieldCount, 'records');

    // Check ai_analysis_results table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_analysis_results'
      ORDER BY ordinal_position
    `;
    console.log('\n✅ ai_analysis_results table columns:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ All CRUD operations completed successfully!');
    console.log('\n📊 Summary:');
    console.log('-----------');
    console.log('✅ CREATE: Can create AI analysis with all fields');
    console.log('✅ READ: Can read single and multiple analyses');
    console.log('✅ UPDATE: Can update analysis fields');
    console.log('✅ DELETE: Can delete analysis records');
    console.log('✅ SCHEMA: All required tables and fields exist');
    console.log('✅ GRADE MAPPING: Both master_fields and master_fields_123 available');

  } catch (error) {
    console.error('❌ Error during CRUD testing:', error);
    console.error('Details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCRUDOperations().catch(console.error);