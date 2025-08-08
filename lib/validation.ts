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
  filters: z.record(z.string(), z.string()).optional(),
});

// User validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['ADMIN', 'DIRECTOR', 'MENTOR', 'TEACHER'], {
    message: 'Invalid role specified'
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
    message: 'Invalid evaluation type'
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
    message: 'Invalid session type'
  }),
});

export const UpdateMentoringSessionSchema = CreateMentoringSessionSchema.partial();

// Resource validation schemas
export const CreateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['DOCUMENT', 'VIDEO', 'LINK', 'TEMPLATE'], {
    message: 'Invalid resource type'
  }),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string().max(50, 'Tag too long')).optional(),
  url: z.string().url('Invalid URL format').optional(),
  fileSize: z.number().min(0, 'File size cannot be negative').optional(),
  language: z.enum(['KH', 'EN'], {
    message: 'Invalid language code'
  }).default('KH'),
});

export const UpdateResourceSchema = CreateResourceSchema.partial();

// Notification validation schemas
export const CreateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR'], {
    message: 'Invalid notification type'
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

// Observation validation schemas
export const SessionInfoSchema = z.object({
  province: z.string().min(1, 'Province is required').max(100, 'Province name too long'),
  provinceCode: z.string().max(10, 'Province code too long').optional(),
  provinceNameKh: z.string().max(100, 'Khmer province name too long').optional(),
  district: z.string().min(1, 'District is required').max(100, 'District name too long'),
  districtCode: z.string().max(10, 'District code too long').optional(),
  districtNameKh: z.string().max(100, 'Khmer district name too long').optional(),
  commune: z.string().max(100, 'Commune name too long').optional(),
  communeCode: z.string().max(10, 'Commune code too long').optional(),
  communeNameKh: z.string().max(100, 'Khmer commune name too long').optional(),
  village: z.string().max(100, 'Village name too long').optional(),
  villageCode: z.string().max(10, 'Village code too long').optional(),
  villageNameKh: z.string().max(100, 'Khmer village name too long').optional(),
  cluster: z.string().max(100, 'Cluster name too long').optional(),
  school: z.string().min(1, 'School is required').max(255, 'School name too long'),
  schoolId: z.number().int('School ID must be an integer').optional(),
  nameOfTeacher: z.string().min(1, 'Teacher name is required').max(255, 'Teacher name too long'),
  sex: z.enum(['M', 'F'], { message: 'Gender must be M or F' }),
  employmentType: z.enum(['official', 'contract', 'volunteer'], { 
    message: 'Invalid employment type'
  }),
  sessionTime: z.enum(['morning', 'afternoon', 'full_day'], { 
    message: 'Invalid session time'
  }),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject name too long'),
  chapter: z.string().max(10, 'Chapter too long').optional(),
  lesson: z.string().max(10, 'Lesson too long').optional(),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  inspectionDate: z.string().datetime('Invalid date format'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  grade: z.number().int('Grade must be an integer').min(1, 'Grade must be at least 1').max(12, 'Grade cannot exceed 12'),
  totalMale: z.number().int('Total male must be an integer').min(0, 'Total male cannot be negative').default(0),
  totalFemale: z.number().int('Total female must be an integer').min(0, 'Total female cannot be negative').default(0),
  totalAbsent: z.number().int('Total absent must be an integer').min(0, 'Total absent cannot be negative').default(0),
  totalAbsentFemale: z.number().int('Total absent female must be an integer').min(0, 'Total absent female cannot be negative').default(0),
  inspectorName: z.string().max(255, 'Inspector name too long').optional(),
  inspectorPosition: z.string().max(100, 'Inspector position too long').optional(),
  inspectorOrganization: z.string().max(255, 'Inspector organization too long').optional(),
  academicYear: z.string().max(20, 'Academic year too long').optional(),
  semester: z.number().int('Semester must be an integer').min(1, 'Semester must be at least 1').max(2, 'Semester cannot exceed 2').optional(),
  lessonDurationMinutes: z.number().int('Lesson duration must be an integer').min(15, 'Lesson duration must be at least 15 minutes').max(240, 'Lesson duration cannot exceed 240 minutes').optional(),
  generalNotes: z.string().optional(),
}).refine(data => data.totalAbsent <= (data.totalMale + data.totalFemale), {
  message: 'Total absent cannot exceed total students',
  path: ['totalAbsent']
});

export const EvaluationDataSchema = z.object({
  evaluationLevels: z.array(z.number().int().min(1).max(3)).min(1, 'At least one evaluation level must be selected'),
}).catchall(z.union([
  z.enum(['yes', 'some_practice', 'no']),
  z.string() // Allow comment fields
]));

export const StudentAssessmentSchema = z.object({
  subjects: z.array(z.object({
    id: z.string().optional(),
    name_km: z.string().min(1, 'Khmer subject name is required'),
    name_en: z.string().min(1, 'English subject name is required'),
    order: z.number().int('Order must be an integer').min(1, 'Order must be at least 1'),
    max_score: z.number().min(0, 'Max score cannot be negative').default(100),
  })),
  students: z.array(z.object({
    id: z.string().optional(),
    identifier: z.string().min(1, 'Student identifier is required'),
    order: z.number().int('Order must be an integer').min(1, 'Order must be at least 1'),
    name: z.string().optional(),
    gender: z.enum(['M', 'F']).optional(),
  })),
  scores: z.record(z.string(), z.record(z.string(), z.number().min(0, 'Score cannot be negative'))).optional(),
});

export const CreateObservationSchema = z.object({
  sessionInfo: SessionInfoSchema,
  evaluationData: EvaluationDataSchema,
  studentAssessment: StudentAssessmentSchema.optional(),
  createdBy: z.string().optional(),
  userRole: z.string().optional(),
  offlineId: z.string().optional(),
});

export const UpdateObservationSchema = z.object({
  sessionInfo: z.object({
    province: z.string().max(100, 'Province name too long').optional(),
    provinceCode: z.string().max(10, 'Province code too long').optional(),
    provinceNameKh: z.string().max(100, 'Khmer province name too long').optional(),
    district: z.string().max(100, 'District name too long').optional(),
    districtCode: z.string().max(10, 'District code too long').optional(),
    districtNameKh: z.string().max(100, 'Khmer district name too long').optional(),
    commune: z.string().max(100, 'Commune name too long').optional(),
    communeCode: z.string().max(10, 'Commune code too long').optional(),
    communeNameKh: z.string().max(100, 'Khmer commune name too long').optional(),
    village: z.string().max(100, 'Village name too long').optional(),
    villageCode: z.string().max(10, 'Village code too long').optional(),
    villageNameKh: z.string().max(100, 'Khmer village name too long').optional(),
    cluster: z.string().max(100, 'Cluster name too long').optional(),
    school: z.string().max(255, 'School name too long').optional(),
    schoolId: z.number().int('School ID must be an integer').optional(),
    nameOfTeacher: z.string().max(255, 'Teacher name too long').optional(),
    sex: z.enum(['M', 'F'], { message: 'Gender must be M or F' }).optional(),
    employmentType: z.enum(['official', 'contract', 'volunteer'], { 
      message: 'Invalid employment type'
    }).optional(),
    sessionTime: z.enum(['morning', 'afternoon', 'full_day'], { 
      message: 'Invalid session time'
    }).optional(),
    subject: z.string().max(100, 'Subject name too long').optional(),
    chapter: z.string().max(10, 'Chapter too long').optional(),
    lesson: z.string().max(10, 'Lesson too long').optional(),
    title: z.string().optional(),
    subTitle: z.string().optional(),
    inspectionDate: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    grade: z.number().int('Grade must be an integer').min(1, 'Grade must be at least 1').max(12, 'Grade cannot exceed 12').optional(),
    totalMale: z.number().int('Total male must be an integer').min(0, 'Total male cannot be negative').optional(),
    totalFemale: z.number().int('Total female must be an integer').min(0, 'Total female cannot be negative').optional(),
    totalAbsent: z.number().int('Total absent must be an integer').min(0, 'Total absent cannot be negative').optional(),
    totalAbsentFemale: z.number().int('Total absent female must be an integer').min(0, 'Total absent female cannot be negative').optional(),
    inspectorName: z.string().max(255, 'Inspector name too long').optional(),
    inspectorPosition: z.string().max(100, 'Inspector position too long').optional(),
    inspectorOrganization: z.string().max(255, 'Inspector organization too long').optional(),
    academicYear: z.string().max(20, 'Academic year too long').optional(),
    semester: z.number().int('Semester must be an integer').min(1, 'Semester must be at least 1').max(2, 'Semester cannot exceed 2').optional(),
    lessonDurationMinutes: z.number().int('Lesson duration must be an integer').min(15, 'Lesson duration must be at least 15 minutes').max(240, 'Lesson duration cannot exceed 240 minutes').optional(),
    generalNotes: z.string().optional(),
  }).partial(),
  evaluationData: EvaluationDataSchema.optional(),
  studentAssessment: StudentAssessmentSchema.optional(),
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
      throw new ValidationError('Request body validation failed', error.issues);
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
      throw new ValidationError('Query parameters validation failed', error.issues);
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
      throw new ValidationError('Path parameters validation failed', error.issues);
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