import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'chhinhs@gmail.com' },
    update: {},
    create: {
      email: 'chhinhs@gmail.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMINISTRATOR',
      authProvider: 'EMAIL',
      isActive: true,
    },
  });

  console.log('Created admin user:', admin);

  // Create indicators from the PRD
  
  // Create sample geographic data
  const geographicData = [
    {
      provinceCode: 1,
      provinceName: 'Banteay Meanchey',
      provinceNameKh: 'បន្ទាយមានជ័យ',
    },
    {
      provinceCode: 2,
      provinceName: 'Battambang',
      provinceNameKh: 'បាត់ដំបង',
    },
    {
      provinceCode: 3,
      provinceName: 'Kampong Cham',
      provinceNameKh: 'កំពង់ចាម',
    },
    {
      provinceCode: 4,
      provinceName: 'Kampong Thom',
      provinceNameKh: 'កំពង់ធំ',
    },
    {
      provinceCode: 12,
      provinceName: 'Phnom Penh',
      provinceNameKh: 'ភ្នំពេញ',
    },
  ];

  for (const geo of geographicData) {
    await prisma.geographic.create({
      data: geo,
    });
    console.log(`Created province: ${geo.provinceName}`);
  }

  // Create districts for Phnom Penh
  const districts = [
    {
      provinceCode: 12,
      provinceName: 'Phnom Penh',
      provinceNameKh: 'ភ្នំពេញ',
      districtCode: BigInt(1201),
      districtName: 'Chamkar Mon',
      districtNameKh: 'ចំការមន',
    },
    {
      provinceCode: 12,
      provinceName: 'Phnom Penh',
      provinceNameKh: 'ភ្នំពេញ',
      districtCode: BigInt(1202),
      districtName: 'Daun Penh',
      districtNameKh: 'ដូនពេញ',
    },
    {
      provinceCode: 12,
      provinceName: 'Phnom Penh',
      provinceNameKh: 'ភ្នំពេញ',
      districtCode: BigInt(1203),
      districtName: '7 Makara',
      districtNameKh: '៧មករា',
    },
  ];

  for (const district of districts) {
    await prisma.geographic.create({
      data: district,
    });
    console.log(`Created district: ${district.districtName}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });