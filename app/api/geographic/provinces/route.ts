import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Use Prisma's type-safe query instead of raw SQL
    const provinces = await prisma.geographic.findMany({
      where: {
        province_code: {
          not: null
        }
      },
      select: {
        province_code: true,
        province_name_kh: true,
        province_name_en: true
      },
      distinct: ['province_code'],
      orderBy: {
        province_code: 'asc'
      }
    });

    // Safely handle potential null values and ensure consistent data structure
    const serializedProvinces = provinces
      .filter(p => p.province_code !== null)
      .map(p => ({
        province_code: p.province_code!,
        province_name_kh: p.province_name_kh || '',
        province_name_en: p.province_name_en || ''
      }));

    return NextResponse.json({ provinces: serializedProvinces });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to fetch provinces' 
      : `Failed to fetch provinces: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}