// Edge-compatible auth utilities
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export type UserRole = 'ADMINISTRATOR' | 'ZONE' | 'PROVINCIAL' | 'DEPARTMENT' | 'CLUSTER' | 'DIRECTOR' | 'TEACHER' | 'MENTOR' | 'PROVINCIAL_DIRECTOR' | 'DISTRICT_DIRECTOR';

export interface JWTPayload {
  userId: string;
  email?: string;
  role: UserRole;
  telegramId?: string;
}

// Simple JWT verification for Edge runtime
export function verifyToken(token: string): JWTPayload | null {
  try {
    // For now, just parse the JWT without verification in Edge runtime
    // This is a temporary solution - in production you should use a proper Edge-compatible JWT library
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload as JWTPayload;
  } catch {
    return null;
  }
}