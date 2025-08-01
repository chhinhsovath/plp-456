import { User, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email?: string;
  role: UserRole;
  telegramId?: string;
}

// Generate JWT token
export function generateToken(user: Partial<User>): string {
  const payload: JWTPayload = {
    userId: user.id!,
    email: user.email || undefined,
    role: user.role!,
    telegramId: user.telegramId?.toString(),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Verify Telegram auth data
export function verifyTelegramAuth(authData: any): boolean {
  const { hash, ...data } = authData;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
  
  // Create check string
  const checkArr = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`);
  const checkString = checkArr.join('\n');
  
  // Create hash
  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  
  // Verify hash
  if (hmac !== hash) {
    return false;
  }
  
  // Check auth date (30 days expiration)
  const authDate = parseInt(data.auth_date);
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - authDate > 30 * 24 * 60 * 60) {
    return false;
  }
  
  return true;
}

// Role hierarchy for permission checking
const roleHierarchy: Record<UserRole, number> = {
  ADMINISTRATOR: 7,
  ZONE: 6,
  PROVINCIAL: 5,
  DEPARTMENT: 4,
  CLUSTER: 3,
  DIRECTOR: 2,
  TEACHER: 1,
};

// Check if user has permission
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Check if user can manage another user
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  const managerLevel = roleHierarchy[managerRole];
  const targetLevel = roleHierarchy[targetRole];
  
  // Can only manage users with lower hierarchy
  return managerLevel > targetLevel;
}

// Get manageable roles for a user
export function getManageableRoles(userRole: UserRole): UserRole[] {
  const userLevel = roleHierarchy[userRole];
  return Object.entries(roleHierarchy)
    .filter(([_, level]) => level < userLevel)
    .map(([role]) => role as UserRole);
}

// Check if user can approve missions
export function canApproveMissions(userRole: UserRole): boolean {
  return ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL'].includes(userRole);
}