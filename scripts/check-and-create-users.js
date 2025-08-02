const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Checking existing users...');
  
  const existingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  
  console.log('\nExisting users:');
  existingUsers.forEach(user => {
    console.log(`- ${user.email} (${user.role})`);
  });
  
  // Define the users we need
  const requiredUsers = [
    {
      email: 'admin@openplp.com',
      password: await hashPassword('admin123'),
      name: 'Administrator',
      role: 'ADMINISTRATOR',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'provincial@openplp.com',
      password: await hashPassword('provincial123'),
      name: 'Provincial Director',
      role: 'PROVINCIAL',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'district@openplp.com',
      password: await hashPassword('district123'),
      name: 'District Director',
      role: 'ZONE',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'mentor@openplp.com',
      password: await hashPassword('mentor123'),
      name: 'Mentor',
      role: 'MENTOR',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'teacher@openplp.com',
      password: await hashPassword('teacher123'),
      name: 'Teacher',
      role: 'TEACHER',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'officer@openplp.com',
      password: await hashPassword('officer123'),
      name: 'Officer',
      role: 'OFFICER',
      auth_provider: 'EMAIL',
      isActive: true,
    },
  ];
  
  console.log('\n\nCreating missing users...');
  
  for (const userData of requiredUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    
    if (!existing) {
      const user = await prisma.user.create({
        data: userData,
      });
      console.log(`✓ Created user: ${user.email}`);
    } else {
      console.log(`- User already exists: ${userData.email}`);
    }
  }
  
  console.log('\nAll required users are now in the database!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });