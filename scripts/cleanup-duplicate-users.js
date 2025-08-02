const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up duplicate users with @example.com...');
  
  const duplicateUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: '@example.com',
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  
  console.log('\nFound duplicate users to remove:');
  duplicateUsers.forEach(user => {
    console.log(`- ${user.email} (${user.name})`);
  });
  
  if (duplicateUsers.length > 0) {
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: '@example.com',
        },
      },
    });
    
    console.log(`\n✓ Removed ${result.count} duplicate users`);
  } else {
    console.log('\nNo duplicate users found');
  }
  
  console.log('\nFinal user list:');
  const finalUsers = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
    },
    orderBy: {
      email: 'asc',
    },
  });
  
  finalUsers.forEach(user => {
    console.log(`- ${user.email} (${user.role})`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });