// Edge-compatible auth utilities (no Node.js crypto module)
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export type UserRole = 'ADMINISTRATOR' | 'ZONE' | 'PROVINCIAL' | 'DEPARTMENT' | 'CLUSTER' | 'DIRECTOR' | 'TEACHER' | 'MENTOR' | 'PROVINCIAL_DIRECTOR' | 'DISTRICT_DIRECTOR';

export interface JWTPayload {
  userId: string;
  email?: string;
  role: UserRole;
  telegramId?: string;
}

// Verify JWT token (Edge-compatible)
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}