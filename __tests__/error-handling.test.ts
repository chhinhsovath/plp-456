import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
  createErrorResponse,
  withErrorHandler,
  handlePrismaError,
  handleZodError
} from '@/lib/error-handler';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Mock console methods
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('Error Handler', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test message', 400, 'TEST_ERROR', { extra: 'data' });
      
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.name).toBe('AppError');
    });

    it('should create ValidationError with correct defaults', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should create NotFoundError with correct resource name', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');
      
      expect(error.message).toBe('Custom forbidden message');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create DatabaseError with details', () => {
      const error = new DatabaseError('Connection failed', { host: 'localhost' });
      
      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.details).toEqual({ host: 'localhost' });
    });
  });

  describe('Prisma Error Handling', () => {
    it('should handle P2002 unique constraint error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['email'] }
        }
      );

      const appError = handlePrismaError(prismaError);
      
      expect(appError).toBeInstanceOf(ValidationError);
      expect(appError.message).toBe('A record with this information already exists');
      expect(appError.details).toEqual({
        field: ['email'],
        code: 'P2002'
      });
    });

    it('should handle P2025 record not found error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0',
        }
      );

      const appError = handlePrismaError(prismaError);
      
      expect(appError).toBeInstanceOf(NotFoundError);
      expect(appError.message).toBe('Record not found');
    });

    it('should handle unknown Prisma error codes', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '4.0.0',
        }
      );

      const appError = handlePrismaError(prismaError);
      
      expect(appError).toBeInstanceOf(DatabaseError);
      expect(appError.message).toBe('Database operation failed');
    });
  });

  describe('Zod Error Handling', () => {
    it('should handle Zod validation errors', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid-email', age: 15 });
      } catch (zodError) {
        const appError = handleZodError(zodError as z.ZodError);
        
        expect(appError).toBeInstanceOf(ValidationError);
        expect(appError.message).toBe('Input validation failed');
        expect(appError.details).toHaveLength(2);
        expect(appError.details[0]).toEqual({
          field: 'email',
          message: 'Invalid email',
          code: 'invalid_string',
        });
        expect(appError.details[1]).toEqual({
          field: 'age',
          message: 'Number must be greater than or equal to 18',
          code: 'too_small',
        });
      }
    });
  });

  describe('Error Response Creation', () => {
    it('should create error response for AppError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const requestId = 'test-request-id';
      
      const response = createErrorResponse(error, requestId);
      
      expect(response.error.message).toBe('Invalid input');
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.details).toEqual({ field: 'email' });
      expect(response.error.requestId).toBe(requestId);
      expect(response.error.timestamp).toBeDefined();
    });

    it('should create error response for unknown error', () => {
      const error = new Error('Unknown error');
      const requestId = 'test-request-id';
      
      const response = createErrorResponse(error, requestId);
      
      expect(response.error.message).toBe('An unexpected error occurred');
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.requestId).toBe(requestId);
    });

    it('should handle Zod errors in createErrorResponse', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]);
      
      const response = createErrorResponse(zodError, 'test-id');
      
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Input validation failed');
    });
  });

  describe('API Handler Wrapper', () => {
    it('should handle successful requests', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      
      const wrappedHandler = withErrorHandler(handler);
      const request = new NextRequest('http://localhost:3000/api/test');
      
      const response = await wrappedHandler(request);
      
      expect(handler).toHaveBeenCalledWith(request);
      expect(response.headers.get('X-Request-ID')).toBeDefined();
    });

    it('should handle AppError thrown by handler', async () => {
      const error = new ValidationError('Invalid data');
      const handler = jest.fn().mockRejectedValue(error);
      
      const wrappedHandler = withErrorHandler(handler);
      const request = new NextRequest('http://localhost:3000/api/test');
      
      const response = await wrappedHandler(request);
      
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toBe('Invalid data');
    });

    it('should handle generic Error thrown by handler', async () => {
      const error = new Error('Something went wrong');
      const handler = jest.fn().mockRejectedValue(error);
      
      const wrappedHandler = withErrorHandler(handler);
      const request = new NextRequest('http://localhost:3000/api/test');
      
      const response = await wrappedHandler(request);
      
      expect(response.status).toBe(500);
      const responseBody = await response.json();
      expect(responseBody.error.code).toBe('INTERNAL_ERROR');
      expect(responseBody.error.message).toBe('An unexpected error occurred');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error in createErrorResponse', () => {
      const response = createErrorResponse(null as any, 'test-id');
      
      expect(response.error.message).toBe('An unexpected error occurred');
      expect(response.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle error without message', () => {
      const error = { statusCode: 400 } as any;
      const response = createErrorResponse(error, 'test-id');
      
      expect(response.error.message).toBe('An unexpected error occurred');
    });

    it('should handle circular reference in error details', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const error = new AppError('Test', 400, 'TEST', circular);
      const response = createErrorResponse(error, 'test-id');
      
      // Should not throw and should have some details
      expect(response.error.details).toBeDefined();
    });
  });
});