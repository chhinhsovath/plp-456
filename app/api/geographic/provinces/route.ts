import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get unique provinces
    const provinces = await prisma.geographic.findMany({
      where: {
        districtCode: null,
        communeCode: null,
        villageCode: null,
      },
      select: {
        provinceCode: true,
        provinceName: true,
        provinceNameKh: true,
      },
      distinct: ['provinceCode'],
      orderBy: {
        provinceCode: 'asc',
      },
    });
    
    return NextResponse.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provinces' },
      { status: 500 }
    );
  }
}