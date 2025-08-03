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

    // Use parameterized query to prevent SQL injection
    // Note: Geographic model has @@ignore directive, so we must use raw SQL
    const districts = await prisma.$queryRaw<Array<{
      district_code: bigint | null;
      district_name_kh: string | null;
      district_name_en: string | null;
    }>>`
      SELECT DISTINCT district_code, district_name_kh, district_name_en
      FROM geographic
      WHERE province_code = ${parsedProvinceCode}
      AND district_code IS NOT NULL
      ORDER BY district_code ASC
    `;

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