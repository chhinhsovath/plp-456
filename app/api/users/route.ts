import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, hashPassword, hasPermission, UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';
import { 
  apiHandler, 
  UnauthorizedError, 
  ForbiddenError, 
  ValidationError, 
  NotFoundError,
  DatabaseError 
} from '@/lib/error-handler';
import { 
  validateQueryParams, 
  validateRequestBody, 
  PaginationSchema, 
  CreateUserSchema 
} from '@/lib/validation';
import { z } from 'zod';
import { retryDatabaseOperation } from '@/lib/retry';
import { errorLogger, logApiError } from '@/lib/error-logger';

// GET /api/users - Get all users
const getUsersHandler = async (request: NextRequest): Promise<NextResponse> => {
  // Verify authentication
  let token = (await cookies()).get('auth-token')?.value;
  
  // Also check dev-auth-token and Authorization header
  if (!token) {
    token = (await cookies()).get('dev-auth-token')?.value;
  }
  
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    throw new UnauthorizedError('Authentication token required');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new UnauthorizedError('Invalid authentication token');
  }

  // Check permissions
  const allowedRoles: UserRole[] = ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'PROVINCIAL_DIRECTOR', 'DISTRICT_DIRECTOR'];
  if (!allowedRoles.includes(payload.role as UserRole)) {
    throw new ForbiddenError('Insufficient permissions to view users');
  }

  // Validate query parameters
  const queryParams = validateQueryParams(request, PaginationSchema.extend({
    role: z.enum(['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'PRINCIPAL', 'TEACHER']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().min(1).max(100).optional(),
  }));

  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', role, isActive, search } = queryParams;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get users with retry on database operations
  const [users, total] = await retryDatabaseOperation(() =>
    Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          auth_provider: true,
          telegramUsername: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ])
  );

  // Log successful operation
  await errorLogger.info('Users retrieved successfully', {
    userId: (payload as any).id,
    count: users.length,
    total,
    filters: { role, isActive, search },
  });

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

export const GET = apiHandler(getUsersHandler);

// POST /api/users - Create new user
const createUserHandler = async (request: NextRequest): Promise<NextResponse> => {
  // Verify authentication
  let token = (await cookies()).get('auth-token')?.value;
  
  // Also check dev-auth-token and Authorization header
  if (!token) {
    token = (await cookies()).get('dev-auth-token')?.value;
  }
  
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    throw new UnauthorizedError('Authentication token required');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new UnauthorizedError('Invalid authentication token');
  }

  // Check permissions
  const allowedRoles: UserRole[] = ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'PROVINCIAL_DIRECTOR'];
  if (!allowedRoles.includes(payload.role as UserRole)) {
    throw new ForbiddenError('Insufficient permissions to create users');
  }

  // Validate request body
  const userData = await validateRequestBody(request, CreateUserSchema);
  const { email, password, firstName, lastName, role, schoolId, phone } = userData;

  // Check if user already exists
  const existingUser = await retryDatabaseOperation(() =>
    prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })
  );

  if (existingUser) {
    throw new ValidationError('User with this email already exists', {
      field: 'email',
      value: email,
    });
  }

  // Validate school exists if schoolId provided
  // Disabled - school model doesn't exist in current schema
  /*
  if (schoolId) {
    const school = await retryDatabaseOperation(() =>
      prisma.school.findUnique({
        where: { id: parseInt(schoolId) },
        select: { id: true },
      })
    );

    if (!school) {
      throw new ValidationError('School not found', {
        field: 'schoolId',
        value: schoolId,
      });
    }
  }
  */

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user with retry
  const user = await retryDatabaseOperation(() =>
    prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        role,
        // schoolId: schoolId ? parseInt(schoolId) : null, // Field doesn't exist in User model
        auth_provider: 'EMAIL',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
  );

  // Log successful creation
  await errorLogger.info('User created successfully', {
    createdById: (payload as any).id,
    newUserId: user.id,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    success: true,
    message: 'User created successfully',
    data: { user },
  }, { status: 201 });
};

export const POST = apiHandler(createUserHandler);