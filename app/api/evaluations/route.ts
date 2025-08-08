import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

// This API endpoint appears to be for a model that doesn't exist in the current schema
// Temporarily returning 501 Not Implemented until the proper model is created

// GET /api/evaluations - Get list of evaluations
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Evaluations API not implemented - model does not exist' },
    { status: 501 }
  );
}

// POST /api/evaluations - Create new evaluation
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Evaluations API not implemented - model does not exist' },
    { status: 501 }
  );
}