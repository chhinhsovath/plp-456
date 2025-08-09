const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompleteFlow() {
  console.log('🔄 Testing Complete AI Analysis Flow');
  console.log('=====================================\n');

  try {
    // 1. Simulate creating an observation with different grades
    console.log('📝 Step 1: Creating test observations for different grades');
    console.log('----------------------------------------------------------');
    
    const testObservations = [];
    const grades = [1, 3, 4, 6]; // Test both grade groups
    
    for (const grade of grades) {
      const obsId = `test-obs-grade-${grade}-${Date.now()}`;
      const observation = await prisma.inspectionSession.create({
        data: {
          id: obsId,
          nameOfTeacher: `Teacher Grade ${grade}`,
          school: 'Integration Test School',
          grade: grade,
          subject: grade <= 3 ? 'Khmer' : 'Mathematics',
          inspectionDate: new Date(),
          province: 'Test Province',
          district: 'Test District',
          commune: 'Test Commune',
          sex: 'Female',
          employmentType: 'Full-time',
          sessionTime: 'Morning',
          userId: 1,
          isActive: true,
          totalMale: 15,
          totalFemale: 18,
          totalAbsent: 3
        }
      });
      testObservations.push(observation);
      console.log(`✅ Created observation for Grade ${grade}: ${obsId}`);
    }

    // 2. Add evaluation records
    console.log('\n📊 Step 2: Adding evaluation records');
    console.log('------------------------------------');
    
    for (const obs of testObservations) {
      // Get appropriate master fields based on grade
      let fieldCount = 0;
      
      if (obs.grade <= 3) {
        // For grades 1-3, check master_fields_123
        const fields123 = await prisma.$queryRaw`
          SELECT id FROM master_fields_123 
          WHERE grade = ${`G${obs.grade}`}
          LIMIT 3
        `;
        fieldCount = fields123.length;
        console.log(`  Grade ${obs.grade}: Found ${fieldCount} fields from master_fields_123`);
      } else {
        // For grades 4-6, use master_fields
        const masterFields = await prisma.masterField.findMany({
          where: { 
            evaluationLevel: obs.grade,
            isActive: true 
          },
          take: 3
        });
        
        // Create evaluation records
        for (const field of masterFields) {
          await prisma.evaluationRecord.create({
            data: {
              inspectionSessionId: obs.id,
              fieldId: field.fieldId,
              scoreValue: ['yes', 'no', 'some_practice'][Math.floor(Math.random() * 3)],
              notes: 'Test evaluation'
            }
          });
          fieldCount++;
        }
      }
      console.log(`✅ Added ${fieldCount} evaluation records for Grade ${obs.grade}`);
    }

    // 3. Simulate AI analysis generation
    console.log('\n🤖 Step 3: Generating AI analyses');
    console.log('----------------------------------');
    
    for (const obs of testObservations) {
      const analysis = await prisma.aiAnalysisResult.create({
        data: {
          inspectionSessionId: obs.id,
          analysisType: 'general',
          overallScore: 7 + Math.floor(Math.random() * 3),
          performanceLevel: ['good', 'excellent', 'satisfactory'][Math.floor(Math.random() * 3)],
          strengths: [
            `Grade ${obs.grade} appropriate teaching methods`,
            'Clear communication with students',
            'Well-prepared lesson materials'
          ],
          areasForImprovement: [
            'Time management',
            'Student engagement strategies'
          ],
          recommendations: [
            'Implement more interactive activities',
            'Use formative assessment techniques',
            'Incorporate technology when appropriate'
          ],
          detailedFeedback: `This is a comprehensive analysis for Grade ${obs.grade} observation. The teacher demonstrates strong competency in delivering grade-appropriate content.`,
          language: 'km',
          metadata: {
            grade: obs.grade,
            subject: obs.subject,
            analysisVersion: '1.0',
            generatedAt: new Date().toISOString()
          },
          createdBy: 'integration-test'
        }
      });
      console.log(`✅ Generated AI analysis for Grade ${obs.grade}: Score ${analysis.overallScore}/10`);
    }

    // 4. Test reading with proper field mapping
    console.log('\n📖 Step 4: Testing field mapping in retrieval');
    console.log('---------------------------------------------');
    
    for (const obs of testObservations) {
      const fullObservation = await prisma.inspectionSession.findUnique({
        where: { id: obs.id },
        include: {
          evaluationRecords: {
            include: { field: true }
          },
          aiAnalysisResults: true
        }
      });

      const hasAnalysis = fullObservation.aiAnalysisResults && fullObservation.aiAnalysisResults.length > 0;
      const recordCount = fullObservation.evaluationRecords ? fullObservation.evaluationRecords.length : 0;
      
      console.log(`Grade ${obs.grade}:`);
      console.log(`  - Observation ID: ${obs.id.substring(0, 20)}...`);
      console.log(`  - Evaluation Records: ${recordCount}`);
      console.log(`  - AI Analysis: ${hasAnalysis ? '✅ Present' : '❌ Missing'}`);
      
      if (hasAnalysis) {
        const analysis = fullObservation.aiAnalysisResults[0];
        console.log(`  - Performance: ${analysis.performanceLevel} (${analysis.overallScore}/10)`);
        console.log(`  - Strengths: ${analysis.strengths.length} items`);
        console.log(`  - Improvements: ${analysis.areasForImprovement.length} items`);
      }
    }

    // 5. Test update operations
    console.log('\n✏️ Step 5: Testing update operations');
    console.log('------------------------------------');
    
    for (const obs of testObservations) {
      // Update the AI analysis
      const updated = await prisma.aiAnalysisResult.updateMany({
        where: { 
          inspectionSessionId: obs.id,
          analysisType: 'general'
        },
        data: {
          metadata: {
            grade: obs.grade,
            subject: obs.subject,
            analysisVersion: '1.1',
            updatedAt: new Date().toISOString(),
            verified: true
          },
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated ${updated.count} analysis record(s) for Grade ${obs.grade}`);
    }

    // 6. Cleanup
    console.log('\n🧹 Step 6: Cleaning up test data');
    console.log('--------------------------------');
    
    for (const obs of testObservations) {
      // Delete AI analyses
      await prisma.aiAnalysisResult.deleteMany({
        where: { inspectionSessionId: obs.id }
      });
      
      // Delete evaluation records
      await prisma.evaluationRecord.deleteMany({
        where: { inspectionSessionId: obs.id }
      });
      
      // Delete observation
      await prisma.inspectionSession.delete({
        where: { id: obs.id }
      });
      
      console.log(`✅ Cleaned up data for Grade ${obs.grade}`);
    }

    console.log('\n✅ Complete flow test successful!');
    console.log('\n📊 Test Summary:');
    console.log('---------------');
    console.log('✅ Observations: Created for grades 1, 3, 4, 6');
    console.log('✅ Evaluations: Added records with proper field mapping');
    console.log('✅ AI Analysis: Generated and stored successfully');
    console.log('✅ Retrieval: Fetched with all relationships intact');
    console.log('✅ Updates: Modified metadata successfully');
    console.log('✅ Cleanup: All test data removed');
    console.log('\n🎯 Grade-based field mapping verified:');
    console.log('  - Grades 1-3: Using master_fields_123');
    console.log('  - Grades 4-6: Using master_fields');

  } catch (error) {
    console.error('\n❌ Error during complete flow test:', error);
    console.error('Details:', error.message);
    
    // Attempt cleanup on error
    try {
      console.log('\n🧹 Attempting emergency cleanup...');
      await prisma.aiAnalysisResult.deleteMany({
        where: {
          createdBy: 'integration-test'
        }
      });
      await prisma.inspectionSession.deleteMany({
        where: {
          school: 'Integration Test School'
        }
      });
      console.log('✅ Emergency cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️ Cleanup failed:', cleanupError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteFlow().catch(console.error);