import { z } from 'zod';
import { NextRequest } from 'next/server';
import { ValidationError } from './error-handler';

// Common validation schemas
export const IdSchema = z.string().uuid('Invalid ID format');

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const SearchSchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').max(255, 'Search query too long').optional(),
  filters: z.record(z.string()).optional(),
});

// User validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['ADMIN', 'DIRECTOR', 'MENTOR', 'TEACHER'], {
    errorMap: () => ({ message: 'Invalid role specified' }),
  }),
  schoolId: z.string().uuid('Invalid school ID').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// School validation schemas
export const CreateSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required').max(100, 'School name too long'),
  address: z.string().min(1, 'Address is required').max(255, 'Address too long'),
  province: z.string().min(1, 'Province is required'),
  district: z.string().min(1, 'District is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email format').optional(),
  principalName: z.string().min(1, 'Principal name is required').max(100, 'Principal name too long'),
  teacherCount: z.number().min(0, 'Teacher count cannot be negative').optional(),
  studentCount: z.number().min(0, 'Student count cannot be negative').optional(),
});

export const UpdateSchoolSchema = CreateSchoolSchema.partial();

// Evaluation validation schemas
export const CreateEvaluationSchema = z.object({
  teacherId: z.string().uuid('Invalid teacher ID'),
  mentorId: z.string().uuid('Invalid mentor ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  criteria: z.array(z.object({
    name: z.string().min(1, 'Criteria name is required'),
    weight: z.number().min(0, 'Weight cannot be negative').max(100, 'Weight cannot exceed 100'),
    description: z.string().optional(),
  })),
  scheduledDate: z.string().datetime('Invalid date format'),
  type: z.enum(['CLASSROOM_OBSERVATION', 'PEER_REVIEW', 'SELF_ASSESSMENT'], {
    errorMap: () => ({ message: 'Invalid evaluation type' }),
  }),
});

export const UpdateEvaluationSchema = CreateEvaluationSchema.partial();

export const SubmitEvaluationSchema = z.object({
  scores: z.array(z.object({
    criteriaId: z.string().uuid('Invalid criteria ID'),
    score: z.number().min(0, 'Score cannot be negative').max(100, 'Score cannot exceed 100'),
    comments: z.string().max(500, 'Comments too long').optional(),
  })),
  overallComments: z.string().max(1000, 'Overall comments too long').optional(),
  recommendations: z.array(z.string().max(200, 'Recommendation too long')).optional(),
});

// Mentoring validation schemas
export const CreateMentoringSessionSchema = z.object({
  mentorId: z.string().uuid('Invalid mentor ID'),
  teacherId: z.string().uuid('Invalid teacher ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  scheduledDate: z.string().datetime('Invalid date format'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours'),
  objectives: z.array(z.string().max(200, 'Objective too long')).optional(),
  type: z.enum(['CLASSROOM_OBSERVATION', 'PLANNING_SUPPORT', 'SKILL_DEVELOPMENT', 'FEEDBACK_SESSION'], {
    errorMap: () => ({ message: 'Invalid session type' }),
  }),
});

export const UpdateMentoringSessionSchema = CreateMentoringSessionSchema.partial();

// Resource validation schemas
export const CreateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['DOCUMENT', 'VIDEO', 'LINK', 'TEMPLATE'], {
    errorMap: () => ({ message: 'Invalid resource type' }),
  }),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string().max(50, 'Tag too long')).optional(),
  url: z.string().url('Invalid URL format').optional(),
  fileSize: z.number().min(0, 'File size cannot be negative').optional(),
  language: z.enum(['KH', 'EN'], {
    errorMap: () => ({ message: 'Invalid language code' }),
  }).default('KH'),
});

export const UpdateResourceSchema = CreateResourceSchema.partial();

// Notification validation schemas
export const CreateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR'], {
    errorMap: () => ({ message: 'Invalid notification type' }),
  }),
  recipientIds: z.array(z.string().uuid('Invalid recipient ID')).min(1, 'At least one recipient is required'),
  scheduledAt: z.string().datetime('Invalid date format').optional(),
  expiresAt: z.string().datetime('Invalid date format').optional(),
});

// AI suggestions validation
export const AIPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
  context: z.object({
    teacherId: z.string().uuid('Invalid teacher ID').optional(),
    subject: z.string().max(50, 'Subject too long').optional(),
    gradeLevel: z.string().max(20, 'Grade level too long').optional(),
    sessionType: z.string().max(50, 'Session type too long').optional(),
  }).optional(),
  maxTokens: z.number().min(50, 'Max tokens too low').max(2000, 'Max tokens too high').default(500),
});

// Validation helper functions
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Request body validation failed', error.errors);
    }
    throw new ValidationError('Invalid JSON in request body');
  }
}

export function validateQueryParams<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Query parameters validation failed', error.errors);
    }
    throw new ValidationError('Invalid query parameters');
  }
}

export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Path parameters validation failed', error.errors);
    }
    throw new ValidationError('Invalid path parameters');
  }
}

// File validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/avi',
  'video/mov',
];

export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new ValidationError(`File type ${file.type} is not allowed`);
  }
}

// Database constraint validation
export function validateForeignKey(id: string | null | undefined, fieldName: string): void {
  if (id && !z.string().uuid().safeParse(id).success) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
}

export function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new ValidationError('Start date must be before end date');
  }
  
  if (start < new Date()) {
    throw new ValidationError('Start date cannot be in the past');
  }
}