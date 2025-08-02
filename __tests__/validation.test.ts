import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
  CreateUserSchema,
  PaginationSchema,
  validateFile,
  validateDateRange,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/validation';
import { ValidationError } from '@/lib/error-handler';

describe('Validation', () => {
  describe('Request Body Validation', () => {
    it('should validate valid user creation data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'validpassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
        phone: '+855123456789',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await validateRequestBody(request, CreateUserSchema);
      expect(result).toEqual(validData);
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'validpassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(validateRequestBody(request, CreateUserSchema))
        .rejects.toThrow(ValidationError);
    });

    it('should reject short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(validateRequestBody(request, CreateUserSchema))
        .rejects.toThrow(ValidationError);
    });

    it('should reject invalid role', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'validpassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'INVALID_ROLE',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(validateRequestBody(request, CreateUserSchema))
        .rejects.toThrow(ValidationError);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(validateRequestBody(request, CreateUserSchema))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Query Parameters Validation', () => {
    it('should validate valid pagination parameters', () => {
      const request = new NextRequest('http://localhost:3000?page=2&limit=20&sortBy=name&sortOrder=asc');
      
      const result = validateQueryParams(request, PaginationSchema);
      
      expect(result).toEqual({
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });

    it('should use default values for missing parameters', () => {
      const request = new NextRequest('http://localhost:3000');
      
      const result = validateQueryParams(request, PaginationSchema);
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      });
    });

    it('should reject invalid page number', () => {
      const request = new NextRequest('http://localhost:3000?page=0');
      
      expect(() => validateQueryParams(request, PaginationSchema))
        .toThrow(ValidationError);
    });

    it('should reject limit exceeding maximum', () => {
      const request = new NextRequest('http://localhost:3000?limit=1000');
      
      expect(() => validateQueryParams(request, PaginationSchema))
        .toThrow(ValidationError);
    });

    it('should reject invalid sort order', () => {
      const request = new NextRequest('http://localhost:3000?sortOrder=invalid');
      
      expect(() => validateQueryParams(request, PaginationSchema))
        .toThrow(ValidationError);
    });
  });

  describe('Path Parameters Validation', () => {
    it('should validate valid UUID path parameter', () => {
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const schema = CreateUserSchema.pick({ schoolId: true }).extend({
        id: CreateUserSchema.shape.schoolId.unwrap(),
      });
      
      const result = validatePathParams(params, schema);
      expect(result.id).toBe(params.id);
    });

    it('should reject invalid UUID format', () => {
      const params = { id: 'invalid-uuid' };
      const schema = CreateUserSchema.pick({ schoolId: true }).extend({
        id: CreateUserSchema.shape.schoolId.unwrap(),
      });
      
      expect(() => validatePathParams(params, schema))
        .toThrow(ValidationError);
    });
  });

  describe('File Validation', () => {
    it('should validate valid image file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      
      expect(() => validateFile(file)).not.toThrow();
    });

    it('should reject file exceeding size limit', () => {
      const file = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1 });
      
      expect(() => validateFile(file)).toThrow(ValidationError);
    });

    it('should reject unsupported file type', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/exe' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      expect(() => validateFile(file)).toThrow(ValidationError);
    });

    it('should validate all allowed file types', () => {
      ALLOWED_FILE_TYPES.forEach(type => {
        const file = new File(['content'], 'test.file', { type });
        Object.defineProperty(file, 'size', { value: 1024 });
        
        expect(() => validateFile(file)).not.toThrow();
      });
    });
  });

  describe('Date Range Validation', () => {
    it('should validate valid future date range', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      expect(() => validateDateRange(
        tomorrow.toISOString(),
        nextWeek.toISOString()
      )).not.toThrow();
    });

    it('should reject start date after end date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(() => validateDateRange(
        tomorrow.toISOString(),
        yesterday.toISOString()
      )).toThrow(ValidationError);
    });

    it('should reject past start date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(() => validateDateRange(
        yesterday.toISOString(),
        tomorrow.toISOString()
      )).toThrow(ValidationError);
    });

    it('should reject same start and end date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(() => validateDateRange(
        tomorrow.toISOString(),
        tomorrow.toISOString()
      )).toThrow(ValidationError);
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should validate user with optional fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'validpassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'TEACHER',
        schoolId: '123e4567-e89b-12d3-a456-426614174000',
        phone: '+855987654321',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await validateRequestBody(request, CreateUserSchema);
      expect(result).toEqual(userData);
    });

    it('should validate user without optional fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'validpassword123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await validateRequestBody(request, CreateUserSchema);
      expect(result).toEqual(userData);
    });

    it('should handle multiple validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
        firstName: '',
        lastName: '',
        role: 'INVALID_ROLE',
        phone: 'invalid-phone',
      };

      const request = new NextRequest('http://localhost:3000', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      try {
        await validateRequestBody(request, CreateUserSchema);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(Array.isArray(validationError.details)).toBe(true);
        expect(validationError.details.length).toBeGreaterThan(1);
      }
    });
  });
});