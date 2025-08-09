const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFieldMapping() {
  console.log('🔍 Verifying Grade-Based Field Mapping');
  console.log('=======================================\n');

  try {
    // Check master_fields_123 for grades 1-3
    console.log('📚 Checking master_fields_123 (for Grades 1-3):');
    console.log('------------------------------------------------');
    
    const fields123 = await prisma.$queryRaw`
      SELECT id, indicator, grade, level 
      FROM master_fields_123 
      WHERE grade IN ('G1', 'G2', 'G3')
      ORDER BY grade, id
      LIMIT 15
    `;
    
    if (fields123 && fields123.length > 0) {
      console.log(`Found ${fields123.length} fields for grades 1-3:`);
      
      // Group by grade for better display
      const byGrade = {};
      fields123.forEach(field => {
        if (!byGrade[field.grade]) byGrade[field.grade] = [];
        byGrade[field.grade].push(field);
      });
      
      Object.keys(byGrade).sort().forEach(grade => {
        console.log(`\n  ${grade}:`);
        byGrade[grade].slice(0, 3).forEach(field => {
          console.log(`    - ID: ${field.id}, Indicator: "${field.indicator.substring(0, 50)}..."`);
        });
      });
    } else {
      console.log('⚠️  No fields found in master_fields_123');
    }

    console.log('\n\n📚 Checking master_fields (for Grades 4-6):');
    console.log('--------------------------------------------');
    
    const masterFields = await prisma.masterField.findMany({
      where: {
        isActive: true,
        evaluationLevel: {
          in: [4, 5, 6]
        }
      },
      select: {
        fieldId: true,
        indicatorSequence: true,
        indicatorSub: true,
        evaluationLevel: true
      },
      orderBy: {
        evaluationLevel: 'asc'
      },
      take: 15
    });
    
    if (masterFields && masterFields.length > 0) {
      console.log(`Found ${masterFields.length} fields for grades 4-6:`);
      
      // Group by level for better display
      const byLevel = {};
      masterFields.forEach(field => {
        const grade = `G${field.evaluationLevel}`;
        if (!byLevel[grade]) byLevel[grade] = [];
        byLevel[grade].push(field);
      });
      
      Object.keys(byLevel).sort().forEach(grade => {
        console.log(`\n  ${grade}:`);
        byLevel[grade].slice(0, 3).forEach(field => {
          console.log(`    - Seq: ${field.indicatorSequence}, Indicator: "${field.indicatorSub?.substring(0, 50)}..."`);
        });
      });
    } else {
      console.log('⚠️  No fields found for grades 4-6 in master_fields');
    }

    // Check recent AI analyses to see field usage
    console.log('\n\n🤖 Recent AI Analyses with Field References:');
    console.log('---------------------------------------------');
    
    const recentAnalyses = await prisma.aiAnalysisResult.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        inspectionSessionId: true,
        strengths: true,
        areasForImprovement: true,
        metadata: true,
        createdAt: true
      }
    });
    
    if (recentAnalyses && recentAnalyses.length > 0) {
      for (const analysis of recentAnalyses) {
        const grade = analysis.metadata?.grade;
        console.log(`\n  Analysis ID: ${analysis.id.substring(0, 8)}...`);
        console.log(`    Grade: ${grade || 'Unknown'}`);
        console.log(`    Created: ${analysis.createdAt}`);
        
        // Check if strengths/improvements contain field indicators
        const hasFieldRefs = (arr) => {
          if (!Array.isArray(arr)) return false;
          return arr.some(item => 
            item.includes('indicator') || 
            item.includes('✓') || 
            item.includes('•')
          );
        };
        
        if (hasFieldRefs(analysis.strengths)) {
          console.log('    ✅ Strengths contain field references');
          if (analysis.strengths && analysis.strengths[0]) {
            console.log(`       Example: "${analysis.strengths[0].substring(0, 60)}..."`);
          }
        }
        
        if (hasFieldRefs(analysis.areasForImprovement)) {
          console.log('    ✅ Improvements contain field references');
          if (analysis.areasForImprovement && analysis.areasForImprovement[0]) {
            console.log(`       Example: "${analysis.areasForImprovement[0].substring(0, 60)}..."`);
          }
        }
      }
    } else {
      console.log('No recent AI analyses found');
    }

    // Check a sample observation to verify field linking
    console.log('\n\n🔗 Sample Observation Field Linking:');
    console.log('-------------------------------------');
    
    const sampleObs = await prisma.inspectionSession.findFirst({
      where: {
        isActive: true,
        evaluationRecords: {
          some: {}
        }
      },
      select: {
        id: true,
        grade: true,
        evaluationRecords: {
          take: 3,
          include: {
            field: {
              select: {
                fieldId: true,
                indicatorSequence: true,
                indicatorMain: true,
                indicatorSub: true
              }
            }
          }
        }
      }
    });
    
    if (sampleObs) {
      console.log(`\n  Observation ID: ${sampleObs.id.substring(0, 8)}...`);
      console.log(`  Grade: ${sampleObs.grade}`);
      console.log(`  Evaluation Records:`);
      
      sampleObs.evaluationRecords.forEach((record, idx) => {
        if (record.field) {
          const indicator = sampleObs.grade && [1, 2, 3].includes(sampleObs.grade)
            ? record.field.indicatorMain
            : record.field.indicatorSub;
          console.log(`    ${idx + 1}. Seq ${record.field.indicatorSequence}: "${indicator?.substring(0, 50)}..."`);
        }
      });
    }

    console.log('\n\n✅ Verification Complete');
    console.log('\nSummary:');
    console.log('- Grade 1-3: Should use master_fields_123.indicator');
    console.log('- Grade 4-6: Should use master_fields.indicator_sub');
    console.log('- AI Analysis should reference correct fields based on grade');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyFieldMapping().catch(console.error);