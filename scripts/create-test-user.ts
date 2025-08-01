import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if users table exists
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Create test user
    const user = await prisma.$executeRaw`
      INSERT INTO users (
        email, 
        password, 
        name, 
        role, 
        auth_provider,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        'test@example.com',
        ${hashedPassword},
        'Test User',
        'DIRECTOR',
        'EMAIL',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `;
    
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
    
    // Try to create the table if it doesn't exist
    if (error.code === '42P01') {
      console.log('Creating users table...');
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'DIRECTOR',
          auth_provider VARCHAR(50) DEFAULT 'EMAIL',
          telegram_id BIGINT UNIQUE,
          telegram_username VARCHAR(255),
          telegram_photo_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Try again
      await createTestUser();
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();