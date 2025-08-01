import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provinceId = searchParams.get('provinceId');
    
    if (!provinceId) {
      return NextResponse.json(
        { error: 'Province ID is required' },
        { status: 400 }
      );
    }
    
    // Get districts for the province
    const districts = await prisma.geographic.findMany({
      where: {
        provinceCode: parseInt(provinceId),
        districtCode: { not: null },
        communeCode: null,
        villageCode: null,
      },
      select: {
        districtCode: true,
        districtName: true,
        districtNameKh: true,
        provinceCode: true,
      },
      distinct: ['districtCode'],
      orderBy: {
        districtCode: 'asc',
      },
    });
    
    return NextResponse.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}