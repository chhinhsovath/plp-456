const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSpecificFields() {
  console.log('🔍 TESTING SPECIFIC FIELDS: Cluster, Position, Organization\n');
  console.log('=' .repeat(80));
  
  try {
    // Create an observation with specific focus on these three fields
    console.log('\n📝 Creating observation with focus on Cluster, Position, Organization...');
    
    const testData = {
      // Required fields
      province: "Test Province",
      district: "Test District",
      commune: "Test Commune",
      school: "Test School",
      nameOfTeacher: "Test Teacher",
      sex: "Male",
      employmentType: "PERMANENT",
      sessionTime: "MORNING",
      subject: "Mathematics",
      grade: 5,
      inspectionDate: new Date(),
      level: 3,
      createdBy: "test@example.com",
      userId: 1,
      
      // SPECIFIC FIELDS WE'RE TESTING
      cluster: "TEST CLUSTER NAME - ចង្កោមទី២",
      inspectorName: "Mr. Test Inspector",
      inspectorPosition: "SENIOR EDUCATION INSPECTOR",
      inspectorOrganization: "PROVINCIAL EDUCATION OFFICE - KAMPOT"
    };

    const created = await prisma.inspectionSession.create({
      data: testData
    });

    console.log('✅ Observation created with ID:', created.id);
    console.log('\n📋 VALUES SENT:');
    console.log(`   Cluster: "${testData.cluster}"`);
    console.log(`   Inspector Position: "${testData.inspectorPosition}"`);
    console.log(`   Inspector Organization: "${testData.inspectorOrganization}"`);

    // Retrieve the observation
    console.log('\n🔍 Retrieving observation from database...');
    const retrieved = await prisma.inspectionSession.findUnique({
      where: { id: created.id }
    });

    console.log('\n📊 VALUES RETRIEVED:');
    console.log(`   Cluster: ${retrieved.cluster ? `"${retrieved.cluster}"` : '❌ NULL'}`);
    console.log(`   Inspector Position: ${retrieved.inspectorPosition ? `"${retrieved.inspectorPosition}"` : '❌ NULL'}`);
    console.log(`   Inspector Organization: ${retrieved.inspectorOrganization ? `"${retrieved.inspectorOrganization}"` : '❌ NULL'}`);

    // Check if values match
    console.log('\n✅ VERIFICATION:');
    const clusterMatch = retrieved.cluster === testData.cluster;
    const positionMatch = retrieved.inspectorPosition === testData.inspectorPosition;
    const organizationMatch = retrieved.inspectorOrganization === testData.inspectorOrganization;

    console.log(`   Cluster stored correctly: ${clusterMatch ? '✅ YES' : '❌ NO'}`);
    console.log(`   Position stored correctly: ${positionMatch ? '✅ YES' : '❌ NO'}`);
    console.log(`   Organization stored correctly: ${organizationMatch ? '✅ YES' : '❌ NO'}`);

    // Test update
    console.log('\n✏️ Testing UPDATE of these fields...');
    const updateData = {
      cluster: "UPDATED CLUSTER - ចង្កោមទី៣",
      inspectorPosition: "CHIEF EDUCATION INSPECTOR",
      inspectorOrganization: "MINISTRY OF EDUCATION - HEAD OFFICE"
    };

    const updated = await prisma.inspectionSession.update({
      where: { id: created.id },
      data: updateData
    });

    console.log('\n📊 UPDATED VALUES:');
    console.log(`   Cluster: ${updated.cluster ? `"${updated.cluster}"` : '❌ NULL'}`);
    console.log(`   Inspector Position: ${updated.inspectorPosition ? `"${updated.inspectorPosition}"` : '❌ NULL'}`);
    console.log(`   Inspector Organization: ${updated.inspectorOrganization ? `"${updated.inspectorOrganization}"` : '❌ NULL'}`);

    // Verify updates
    const clusterUpdated = updated.cluster === updateData.cluster;
    const positionUpdated = updated.inspectorPosition === updateData.inspectorPosition;
    const organizationUpdated = updated.inspectorOrganization === updateData.inspectorOrganization;

    console.log('\n✅ UPDATE VERIFICATION:');
    console.log(`   Cluster updated: ${clusterUpdated ? '✅ YES' : '❌ NO'}`);
    console.log(`   Position updated: ${positionUpdated ? '✅ YES' : '❌ NO'}`);
    console.log(`   Organization updated: ${organizationUpdated ? '✅ YES' : '❌ NO'}`);

    // Check database column limits
    console.log('\n📏 CHECKING DATABASE COLUMN LIMITS:');
    
    // Test with maximum length values
    const maxLengthData = {
      cluster: 'C'.repeat(100), // cluster is VARCHAR(100)
      inspectorPosition: 'P'.repeat(100), // inspector_position is VARCHAR(100)
      inspectorOrganization: 'O'.repeat(255) // inspector_organization is VARCHAR(255)
    };

    try {
      await prisma.inspectionSession.update({
        where: { id: created.id },
        data: maxLengthData
      });
      console.log('   ✅ Maximum length values stored successfully');
    } catch (error) {
      console.log('   ❌ Error with maximum length values:', error.message);
    }

    // SQL query to verify directly
    console.log('\n💾 DIRECT SQL VERIFICATION:');
    console.log(`   Run this query to verify in database:`);
    console.log(`   SELECT cluster, inspector_position, inspector_organization`);
    console.log(`   FROM inspection_sessions`);
    console.log(`   WHERE id = '${created.id}';`);

    // Clean up
    await prisma.inspectionSession.delete({
      where: { id: created.id }
    });
    console.log('\n🧹 Test data cleaned up');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '=' .repeat(80));
}

// Run test
testSpecificFields();