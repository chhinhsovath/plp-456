import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // First, let's check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('Existing tables:', tables);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Try to create the users table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'ADMINISTRATOR',
        auth_provider VARCHAR(50) DEFAULT 'EMAIL',
        telegram_id BIGINT UNIQUE,
        telegram_username VARCHAR(255),
        telegram_photo_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Users table created/verified');
    
    // Insert the admin user
    const result = await prisma.$executeRaw`
      INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        auth_provider,
        is_active
      ) VALUES (
        'chhinhs@gmail.com',
        ${hashedPassword},
        'System Administrator',
        'ADMINISTRATOR',
        'EMAIL',
        true
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = ${hashedPassword},
        updated_at = CURRENT_TIMESTAMP
      RETURNING email, name, role
    `;
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: chhinhs@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: ADMINISTRATOR');
    
    // Verify the user was created
    const user = await prisma.$queryRaw`
      SELECT id, email, name, role, is_active 
      FROM users 
      WHERE email = 'chhinhs@gmail.com'
    `;
    
    console.log('\nUser details:', user);
    
  } catch (error) {
    console.error('Error:', error);
    
    // If error is about missing User model, try raw SQL for everything
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2021') {
      console.log('Trying alternative approach...');
      
      try {
        // Create table and user with raw SQL
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255),
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'ADMINISTRATOR',
            auth_provider VARCHAR(50) DEFAULT 'EMAIL',
            telegram_id BIGINT UNIQUE,
            telegram_username VARCHAR(255),
            telegram_photo_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await prisma.$executeRaw`
          INSERT INTO users (email, password, name, role, auth_provider, is_active)
          VALUES ('chhinhs@gmail.com', ${hashedPassword}, 'System Administrator', 'ADMINISTRATOR', 'EMAIL', true)
          ON CONFLICT (email) DO UPDATE SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP;
        `;
        
        console.log('✅ Admin user created with alternative approach!');
        console.log('📧 Email: chhinhs@gmail.com');
        console.log('🔑 Password: admin123');
        
      } catch (altError) {
        console.error('Alternative approach failed:', altError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser();