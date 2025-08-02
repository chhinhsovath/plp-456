import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import validator from 'validator';

// XSS Prevention
export function sanitizeHtml(input: string, options?: DOMPurify.Config): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options,
  });
}

export function stripHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// SQL Injection Prevention (Note: Prisma already prevents SQL injection)
export function escapeSqlIdentifier(identifier: string): string {
  // Remove any non-alphanumeric characters except underscore
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

export function validateSqlIdentifier(identifier: string): boolean {
  // Valid SQL identifier pattern
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

export function isValidPath(path: string, allowedPaths: string[]): boolean {
  const sanitized = sanitizePath(path);
  return allowedPaths.some(allowed => sanitized.startsWith(allowed));
}

export function validateCommand(command: string, allowedCommands: string[]): boolean {
  const cmd = command.split(' ')[0];
  return allowedCommands.includes(cmd);
}

// NoSQL Injection Prevention
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  const sanitized: any = Array.isArray(query) ? [] : {};

  for (const key in query) {
    if (key.startsWith('$')) {
      // Remove MongoDB operators from user input
      continue;
    }

    const value = query[key];
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Path Traversal Prevention
export function sanitizePath(path: string): string {
  // Remove any path traversal attempts
  return path
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/')
    .replace(/^\//, '');
}

export function isValidPath(path: string, allowedPaths: string[]): boolean {
  const sanitized = sanitizePath(path);
  return allowedPaths.some(allowed => sanitized.startsWith(allowed));
}

// Command Injection Prevention
export function sanitizeShellArg(arg: string): string {
  // Escape shell special characters
  return arg.replace(/(["\s'$`\\])/g, '\\$1');
}

export function validateCommand(command: string, allowedCommands: string[]): boolean {
  const cmd = command.split(' ')[0];
  return allowedCommands.includes(cmd);
}

// Input Validation and Sanitization Schemas
export const SanitizedStringSchema = z.string().transform((val) => stripHtml(val));

export const SafeHtmlSchema = z.string().transform((val) => sanitizeHtml(val));

export const EmailSchema = z.string()
  .email('Invalid email format')
  .transform((val) => validator.normalizeEmail(val) || val);

export const UrlSchema = z.string()
  .url('Invalid URL format')
  .transform((val) => {
    try {
      const url = new URL(val);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      throw new Error('Invalid URL');
    }
  });

export const PhoneSchema = z.string()
  .transform((val) => validator.escape(val))
  .refine((val) => validator.isMobilePhone(val, 'any'), {
    message: 'Invalid phone number',
  });

export const AlphanumericSchema = z.string()
  .regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters allowed');

export const UsernameSchema = z.string()
  .min(3, 'Username too short')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const FileNameSchema = z.string()
  .transform((val) => sanitizePath(val))
  .refine((val) => !val.includes('/'), {
    message: 'File name cannot contain directory separators',
  });

// LDAP Injection Prevention
export function escapeLdapFilter(input: string): string {
  return input
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\\/g, '\\5c')
    .replace(/\0/g, '\\00')
    .replace(/\//g, '\\2f');
}

// CSV Injection Prevention
export function sanitizeCsvField(field: string): string {
  // Prevent formula injection
  if (/^[=+\-@]/.test(field)) {
    return `'${field}`;
  }
  // Escape quotes
  if (field.includes('"') || field.includes(',') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// JSON Data Sanitization
export function sanitizeJson(data: any, maxDepth: number = 10): any {
  if (maxDepth <= 0) {
    throw new Error('Maximum depth exceeded');
  }

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return stripHtml(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item, maxDepth - 1));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Sanitize the key
        const sanitizedKey = escapeSqlIdentifier(key);
        // Sanitize the value
        sanitized[sanitizedKey] = sanitizeJson(data[key], maxDepth - 1);
      }
    }
    return sanitized;
  }

  // Unknown type, return as string
  return String(data);
}

// Content Security Policy (CSP) Nonce Generation
export function generateCspNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// Input Length Validation
export function validateLength(
  input: string,
  field: string,
  min: number,
  max: number
): void {
  if (input.length < min) {
    throw new Error(`${field} must be at least ${min} characters long`);
  }
  if (input.length > max) {
    throw new Error(`${field} must not exceed ${max} characters`);
  }
}

// Credit Card Sanitization (PCI DSS compliance)
export function maskCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 8) {
    return '*'.repeat(cleaned.length);
  }
  const firstSix = cleaned.substring(0, 6);
  const lastFour = cleaned.substring(cleaned.length - 4);
  const masked = '*'.repeat(cleaned.length - 10);
  return `${firstSix}${masked}${lastFour}`;
}

// Email Address Sanitization (for display)
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);
  
  return `${maskedLocal}@${domain}`;
}

// IP Address Validation
export function isValidIpAddress(ip: string): boolean {
  return validator.isIP(ip);
}

// Sanitization Middleware
export function createSanitizationMiddleware(
  schema: z.ZodSchema,
  options?: { 
    stripUnknown?: boolean;
    maxDepth?: number;
  }
) {
  return async function sanitize(data: any): Promise<any> {
    try {
      // First, do a deep sanitization
      const sanitized = sanitizeJson(data, options?.maxDepth || 10);
      
      // Then validate with schema
      const result = await schema.parseAsync(sanitized);
      
      // Strip unknown fields if requested
      if (options?.stripUnknown && typeof result === 'object') {
        const schemaKeys = Object.keys(schema.shape || {});
        const filtered: any = {};
        for (const key of schemaKeys) {
          if (key in result) {
            filtered[key] = result[key];
          }
        }
        return filtered;
      }
      
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}

// Rate limiting for specific inputs
const inputAttempts = new Map<string, number[]>();

export function checkInputRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const attempts = inputAttempts.get(identifier) || [];
  
  // Remove old attempts
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false;
  }
  
  recentAttempts.push(now);
  inputAttempts.set(identifier, recentAttempts);
  
  return true;
}

// Prevent homograph attacks
export function normalizeUnicode(input: string): string {
  // Convert to ASCII equivalent where possible
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

// Safe JSON parsing
export function safeJsonParse<T = any>(json: string): T | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Export all sanitizers as a single object for convenience
export const sanitizers = {
  html: sanitizeHtml,
  stripHtml,
  sql: escapeSqlIdentifier,
  mongo: sanitizeMongoQuery,
  path: sanitizePath,
  shell: sanitizeShellArg,
  ldap: escapeLdapFilter,
  csv: sanitizeCsvField,
  json: sanitizeJson,
  creditCard: maskCreditCard,
  email: maskEmail,
  unicode: normalizeUnicode,
};