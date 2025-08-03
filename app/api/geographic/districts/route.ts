import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provinceCode = searchParams.get('provinceCode');

    // Input validation
    if (!provinceCode) {
      return NextResponse.json(
        { error: 'Province code is required' },
        { status: 400 }
      );
    }

    // Validate provinceCode is a valid number
    const parsedProvinceCode = parseInt(provinceCode, 10);
    if (isNaN(parsedProvinceCode) || parsedProvinceCode <= 0) {
      return NextResponse.json(
        { error: 'Invalid province code format' },
        { status: 400 }
      );
    }

    // Use Prisma's type-safe query instead of raw SQL to prevent SQL injection
    const districts = await prisma.geographic.findMany({
      where: {
        province_code: parsedProvinceCode,
        district_code: {
          not: null
        }
      },
      select: {
        district_code: true,
        district_name_kh: true,
        district_name_en: true
      },
      distinct: ['district_code'],
      orderBy: {
        district_code: 'asc'
      }
    });

    // Safely handle BigInt serialization with null checks
    const serializedDistricts = districts
      .filter(d => d.district_code !== null)
      .map(d => ({
        district_code: d.district_code!.toString(),
        district_name_kh: d.district_name_kh || '',
        district_name_en: d.district_name_en || ''
      }));

    return NextResponse.json({ districts: serializedDistricts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to fetch districts' 
      : `Failed to fetch districts: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}