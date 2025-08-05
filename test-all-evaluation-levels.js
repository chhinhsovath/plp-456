const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAllEvaluationLevels() {
  console.log('🔍 TESTING ALL EVALUATION LEVELS AND INDICATORS\n');
  console.log('=' .repeat(80));
  
  try {
    // First, show all available indicators
    console.log('\n📋 AVAILABLE INDICATORS BY LEVEL:\n');
    
    const indicators = await prisma.masterField.findMany({
      where: { isActive: true },
      orderBy: [
        { evaluationLevel: 'asc' },
        { indicatorSequence: 'asc' }
      ]
    });
    
    // Group by level
    const byLevel = {};
    indicators.forEach(ind => {
      if (!byLevel[ind.evaluationLevel]) {
        byLevel[ind.evaluationLevel] = [];
      }
      byLevel[ind.evaluationLevel].push(ind);
    });
    
    // Display indicators by level
    for (const level of [1, 2, 3]) {
      console.log(`\n📊 LEVEL ${level} (${byLevel[level]?.length || 0} indicators):`);
      if (byLevel[level]) {
        byLevel[level].forEach(ind => {
          console.log(`   #${ind.indicatorSequence} - ${ind.indicatorMain} - ${ind.indicatorSub}`);
        });
      }
    }
    
    // Create a test observation with ALL levels selected
    console.log('\n\n📝 CREATING TEST OBSERVATION WITH ALL 3 LEVELS...\n');
    
    const testObservation = await prisma.inspectionSession.create({
      data: {
        province: "Test Province",
        district: "Test District",
        commune: "Test Commune",
        school: "Test School - All Levels",
        nameOfTeacher: "Test Teacher",
        sex: "Female",
        employmentType: "PERMANENT",
        sessionTime: "MORNING",
        subject: "Mathematics",
        grade: 5,
        inspectionDate: new Date(),
        level: 3, // Highest level selected
        createdBy: "test@example.com",
        userId: 1
      }
    });
    
    console.log(`✅ Created observation: ${testObservation.id}`);
    
    // Create evaluation records for ALL indicators across ALL levels
    console.log('\n📊 CREATING EVALUATION RECORDS FOR ALL INDICATORS...\n');
    
    let recordCount = 0;
    for (const indicator of indicators) {
      // Alternate scores for variety
      const scores = ['yes', 'some_practice', 'no'];
      const score = scores[recordCount % 3];
      
      await prisma.evaluationRecord.create({
        data: {
          inspectionSessionId: testObservation.id,
          fieldId: indicator.fieldId,
          scoreValue: score,
          notes: `Test comment for indicator ${indicator.indicatorSequence} (Level ${indicator.evaluationLevel})`,
          createdBy: "test@example.com"
        }
      });
      
      recordCount++;
    }
    
    console.log(`✅ Created ${recordCount} evaluation records`);
    
    // Verify all data was saved
    console.log('\n🔍 VERIFYING STORED DATA...\n');
    
    const saved = await prisma.inspectionSession.findUnique({
      where: { id: testObservation.id },
      include: {
        evaluationRecords: {
          include: { field: true }
        }
      }
    });
    
    console.log(`Observation level: ${saved.level}`);
    console.log(`Total evaluation records saved: ${saved.evaluationRecords.length}`);
    
    // Count by level
    const savedByLevel = { 1: 0, 2: 0, 3: 0 };
    saved.evaluationRecords.forEach(rec => {
      savedByLevel[rec.field.evaluationLevel]++;
    });
    
    console.log('\nRecords saved by level:');
    console.log(`  Level 1: ${savedByLevel[1]} records`);
    console.log(`  Level 2: ${savedByLevel[2]} records`);
    console.log(`  Level 3: ${savedByLevel[3]} records`);
    
    // Show sample of saved data
    console.log('\nSample of saved evaluation data:');
    saved.evaluationRecords.slice(0, 5).forEach(rec => {
      console.log(`  Indicator #${rec.field.indicatorSequence} (L${rec.field.evaluationLevel}): ${rec.scoreValue} - "${rec.notes}"`);
    });
    
    // Check for missing indicators
    const savedIndicatorIds = saved.evaluationRecords.map(r => r.fieldId);
    const missingIndicators = indicators.filter(ind => !savedIndicatorIds.includes(ind.fieldId));
    
    if (missingIndicators.length > 0) {
      console.log(`\n⚠️  WARNING: ${missingIndicators.length} indicators were not saved:`);
      missingIndicators.forEach(ind => {
        console.log(`   - #${ind.indicatorSequence} (Level ${ind.evaluationLevel})`);
      });
    } else {
      console.log('\n✅ ALL INDICATORS WERE SAVED SUCCESSFULLY!');
    }
    
    // Clean up
    await prisma.inspectionSession.delete({
      where: { id: testObservation.id }
    });
    console.log('\n🧹 Test data cleaned up');
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 SUMMARY:');
    console.log(`- Total indicators available: ${indicators.length}`);
    console.log(`- Level 1: ${byLevel[1]?.length || 0} indicators`);
    console.log(`- Level 2: ${byLevel[2]?.length || 0} indicators`);
    console.log(`- Level 3: ${byLevel[3]?.length || 0} indicators`);
    console.log(`- All indicators can be saved: ${recordCount === indicators.length ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testAllEvaluationLevels();