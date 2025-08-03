import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const provinces = await prisma.$queryRaw<Array<{
      province_code: number;
      province_name_kh: string;
      province_name_en: string;
    }>>`
      SELECT DISTINCT 
        province_code,
        province_name_kh,
        province_name_en
      FROM geographic
      WHERE province_code IS NOT NULL
      ORDER BY province_code
    `;

    return NextResponse.json({ provinces });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provinces' },
      { status: 500 }
    );
  }
}