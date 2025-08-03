import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const districtCode = searchParams.get('districtCode');

    if (!districtCode) {
      return NextResponse.json(
        { error: 'District code is required' },
        { status: 400 }
      );
    }

    const communes = await prisma.$queryRaw<Array<{
      commune_code: bigint;
      commune_name_kh: string;
      commune_name_en: string;
    }>>`
      SELECT DISTINCT 
        commune_code,
        commune_name_kh,
        commune_name_en
      FROM geographic
      WHERE district_code = ${BigInt(districtCode)}
        AND commune_code IS NOT NULL
      ORDER BY commune_code
    `;

    // Convert BigInt to string for JSON serialization
    const serializedCommunes = communes.map(c => ({
      ...c,
      commune_code: c.commune_code.toString()
    }));

    return NextResponse.json({ communes: serializedCommunes });
  } catch (error) {
    console.error('Error fetching communes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communes' },
      { status: 500 }
    );
  }
}