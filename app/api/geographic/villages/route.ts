import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const communeCode = searchParams.get('communeCode');

    if (!communeCode) {
      return NextResponse.json(
        { error: 'Commune code is required' },
        { status: 400 }
      );
    }

    const villages = await prisma.$queryRaw<Array<{
      village_code: bigint;
      village_name_kh: string;
      village_name_en: string;
    }>>`
      SELECT DISTINCT 
        village_code,
        village_name_kh,
        village_name_en
      FROM geographic
      WHERE commune_code = ${BigInt(communeCode)}
        AND village_code IS NOT NULL
      ORDER BY village_code
    `;

    // Convert BigInt to string for JSON serialization
    const serializedVillages = villages.map(v => ({
      ...v,
      village_code: v.village_code.toString()
    }));

    return NextResponse.json({ villages: serializedVillages });
  } catch (error) {
    console.error('Error fetching villages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch villages' },
      { status: 500 }
    );
  }
}