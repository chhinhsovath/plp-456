import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

// This API endpoint appears to be for a model that doesn't exist in the current schema
// Temporarily returning 501 Not Implemented until the proper model is created

// GET /api/evaluations/[id] - Get single evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Evaluations API not implemented - model does not exist' },
    { status: 501 }
  );
}

// PATCH /api/evaluations/[id] - Update evaluation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Evaluations API not implemented - model does not exist' },
    { status: 501 }
  );
}

// DELETE /api/evaluations/[id] - Delete evaluation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: 'Evaluations API not implemented - model does not exist' },
    { status: 501 }
  );
}