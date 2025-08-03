import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provinceCode = searchParams.get('provinceCode');
    const district = searchParams.get('district');
    const commune = searchParams.get('commune');
    const searchTerm = searchParams.get('search');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (provinceCode) {
      whereClause += ' AND "sclProvince" = $' + (params.length + 1);
      params.push(provinceCode);
    }

    if (district) {
      whereClause += ' AND "sclDistrict" ILIKE $' + (params.length + 1);
      params.push(`%${district}%`);
    }

    if (commune) {
      whereClause += ' AND "sclCommune" ILIKE $' + (params.length + 1);
      params.push(`%${commune}%`);
    }

    if (searchTerm) {
      whereClause += ' AND ("sclName" ILIKE $' + (params.length + 1) + ' OR "sclCode" ILIKE $' + (params.length + 2) + ')';
      params.push(`%${searchTerm}%`);
      params.push(`%${searchTerm}%`);
    }

    const query = `
      SELECT 
        "sclAutoID" as id,
        "sclName" as name,
        "sclCode" as code,
        "sclProvince" as province,
        "sclDistrict" as district,
        "sclCommune" as commune,
        "sclCluster" as cluster,
        province_code,
        latitude,
        longitude
      FROM schools
      ${whereClause}
      ORDER BY "sclName"
      LIMIT 50
    `;

    const schools = await prisma.$queryRawUnsafe<Array<{
      id: number;
      name: string;
      code: string;
      province: string;
      district: string;
      commune: string;
      cluster: string | null;
      province_code: number | null;
      latitude: number | null;
      longitude: number | null;
    }>>(query, ...params);

    return NextResponse.json({ schools });
  } catch (error) {
    console.error('Error searching schools:', error);
    return NextResponse.json(
      { error: 'Failed to search schools' },
      { status: 500 }
    );
  }
}