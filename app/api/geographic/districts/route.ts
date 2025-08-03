import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provinceCode = searchParams.get('provinceCode');

    if (!provinceCode) {
      return NextResponse.json(
        { error: 'Province code is required' },
        { status: 400 }
      );
    }

    const districts = await prisma.$queryRaw<Array<{
      district_code: bigint;
      district_name_kh: string;
      district_name_en: string;
    }>>`
      SELECT DISTINCT 
        district_code,
        district_name_kh,
        district_name_en
      FROM geographic
      WHERE province_code = ${parseInt(provinceCode)}
        AND district_code IS NOT NULL
      ORDER BY district_code
    `;

    // Convert BigInt to string for JSON serialization
    const serializedDistricts = districts.map(d => ({
      ...d,
      district_code: d.district_code.toString()
    }));

    return NextResponse.json({ districts: serializedDistricts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}