import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Fetch all fields from master_fields_123 table using raw query
    const fields = await prisma.$queryRaw`
      SELECT 
        id,
        "order",
        subject,
        grade,
        level,
        field_type_one,
        field_type_two,
        field_type_three,
        field_type_four,
        activity,
        indicator,
        note
      FROM master_fields_123
      ORDER BY "order", id
    `;

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching master fields 123:", error);
    return NextResponse.json(
      { error: "Failed to fetch master fields" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, grade, levels } = body;

    // Build dynamic WHERE clause
    let whereConditions = [];
    let queryParams = [];
    
    if (subject) {
      whereConditions.push(`subject = $${queryParams.length + 1}`);
      queryParams.push(subject);
    }
    
    if (grade) {
      whereConditions.push(`(grade LIKE $${queryParams.length + 1} OR grade = $${queryParams.length + 2})`);
      queryParams.push(`%${grade}%`);
      queryParams.push(grade);
    }
    
    if (levels && levels.length > 0) {
      const levelPlaceholders = levels.map((_: any, i: number) => `$${queryParams.length + i + 1}`).join(',');
      whereConditions.push(`level IN (${levelPlaceholders})`);
      queryParams.push(...levels);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Execute query with dynamic parameters
    const query = `
      SELECT 
        id,
        "order",
        subject,
        grade,
        level,
        field_type_one,
        field_type_two,
        field_type_three,
        field_type_four,
        activity,
        indicator,
        note
      FROM master_fields_123
      ${whereClause}
      ORDER BY "order", id
    `;
    
    const fields = await prisma.$queryRawUnsafe(query, ...queryParams);

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching filtered master fields 123:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered master fields" },
      { status: 500 }
    );
  }
}