import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error (${service}): ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function logError(error: Error, context: {
  requestId: string;
  method: string;
  url: string;
  userId?: string;
  userAgent?: string;
}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    userId: context.userId,
    userAgent: context.userAgent,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof ApiError && {
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
      }),
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', JSON.stringify(errorLog, null, 2));
  }

  // In production, you would send this to your logging service
  // Example: await logToService(errorLog);
  
  // Store in database if needed
  try {
    // Uncomment if you want to store errors in database
    // await prisma.errorLog.create({ data: errorLog });
  } catch (dbError) {
    console.error('Failed to log error to database:', dbError);
  }
}

export function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      return new ValidationError('A record with this information already exists', {
        field: error.meta?.target,
        code: error.code,
      });
    case 'P2014':
      return new ValidationError('The change you are trying to make would violate a required relation', {
        code: error.code,
      });
    case 'P2003':
      return new ValidationError('Foreign key constraint failed', {
        field: error.meta?.field_name,
        code: error.code,
      });
    case 'P2025':
      return new NotFoundError('Record');
    default:
      return new DatabaseError('Database operation failed', {
        code: error.code,
        meta: error.meta,
      });
  }
}

export function handleZodError(error: ZodError): ValidationError {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError('Input validation failed', details);
}

export function createErrorResponse(error: Error, requestId: string): ErrorResponse {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    const validationError = handleZodError(error);
    statusCode = validationError.statusCode;
    code = validationError.code;
    message = validationError.message;
    details = validationError.details;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    code = prismaError.code;
    message = prismaError.message;
    details = prismaError.details;
  }

  return {
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

export function withErrorHandler<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    
    try {
      // Add request ID to headers for tracking
      const response = await handler(req, ...args);
      response.headers.set('X-Request-ID', requestId);
      return response;
    } catch (error) {
      // Log the error
      await logError(error as Error, {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent') || undefined,
        // Extract userId from token if available
        userId: extractUserIdFromRequest(req),
      });

      // Create error response
      const errorResponse = createErrorResponse(error as Error, requestId);
      
      return NextResponse.json(errorResponse, {
        status: error instanceof ApiError ? error.statusCode : 500,
        headers: {
          'X-Request-ID': requestId,
        },
      });
    }
  };
}

function extractUserIdFromRequest(req: NextRequest): string | undefined {
  try {
    // Extract from auth token or session
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Parse JWT token to get user ID
      // This is a simplified example - implement based on your auth system
      const token = authHeader.replace('Bearer ', '');
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // return decoded.userId;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// Utility function for API route handlers
export const apiHandler = withErrorHandler;