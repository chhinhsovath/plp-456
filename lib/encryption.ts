// Client-safe stub for encryption module
// Actual implementation is in encryption.server.ts

export class CryptoService {
  constructor(masterKeyBase64: string, config: any = {}) {
    console.warn('CryptoService is not available on the client side');
  }

  async encrypt(plaintext: string | Buffer): Promise<string> {
    throw new Error('Encryption is not available on the client side');
  }

  async decrypt(encryptedData: string): Promise<string> {
    throw new Error('Decryption is not available on the client side');
  }

  async encryptObject<T>(obj: T): Promise<string> {
    throw new Error('Encryption is not available on the client side');
  }

  async decryptObject<T>(encryptedData: string): Promise<T> {
    throw new Error('Decryption is not available on the client side');
  }

  hash(data: string | Buffer, algorithm?: string): string {
    throw new Error('Hashing is not available on the client side');
  }

  hmac(data: string | Buffer, key: string | Buffer, algorithm?: string): string {
    throw new Error('HMAC is not available on the client side');
  }

  generateToken(length?: number): string {
    throw new Error('Token generation is not available on the client side');
  }

  generateId(): string {
    // Use browser crypto API for client-side ID generation
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  timingSafeEqual(a: string | Buffer, b: string | Buffer): boolean {
    throw new Error('Timing-safe comparison is not available on the client side');
  }
}

export class FieldEncryption {
  constructor(masterKey: string) {
    console.warn('FieldEncryption is not available on the client side');
  }

  async encryptFields<T extends Record<string, any>>(obj: T, fields: Array<keyof T>): Promise<T> {
    throw new Error('Field encryption is not available on the client side');
  }

  async decryptFields<T extends Record<string, any>>(obj: T, fields: Array<keyof T>): Promise<T> {
    throw new Error('Field decryption is not available on the client side');
  }

  async encryptArray<T>(items: T[]): Promise<string[]> {
    throw new Error('Array encryption is not available on the client side');
  }

  async decryptArray<T>(encryptedItems: string[]): Promise<T[]> {
    throw new Error('Array decryption is not available on the client side');
  }
}

export class PasswordHasher {
  constructor(rounds?: number) {
    console.warn('PasswordHasher is not available on the client side');
  }

  async hash(password: string): Promise<string> {
    throw new Error('Password hashing is not available on the client side');
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    throw new Error('Password verification is not available on the client side');
  }
}

export class TokenManager {
  constructor(masterKey: string, ttlSeconds?: number) {
    console.warn('TokenManager is not available on the client side');
  }

  async generateToken(payload: any): Promise<string> {
    throw new Error('Token generation is not available on the client side');
  }

  async validateToken<T = any>(token: string): Promise<T | null> {
    throw new Error('Token validation is not available on the client side');
  }

  async revokeToken(token: string): Promise<void> {
    throw new Error('Token revocation is not available on the client side');
  }
}

export class SecureSessionManager {
  constructor(masterKey: string, sessionTTLSeconds?: number) {
    console.warn('SecureSessionManager is not available on the client side');
  }

  async createSession(userId: string, metadata?: any): Promise<{ sessionId: string; sessionToken: string }> {
    throw new Error('Session creation is not available on the client side');
  }

  async validateSession(sessionToken: string): Promise<{ valid: boolean; userId?: string; sessionId?: string; metadata?: any }> {
    throw new Error('Session validation is not available on the client side');
  }
}

export class PIIProtection {
  constructor(masterKey: string) {
    console.warn('PIIProtection is not available on the client side');
  }

  async tokenize(piiData: string): Promise<string> {
    throw new Error('PII tokenization is not available on the client side');
  }

  async detokenize(token: string): Promise<string | null> {
    throw new Error('PII detokenization is not available on the client side');
  }

  maskPII(data: string, type: 'email' | 'phone' | 'ssn' | 'credit_card'): string {
    // This can work on the client side
    switch (type) {
      case 'email':
        const [localPart, domain] = data.split('@');
        if (!domain) return '***';
        const masked = localPart.length > 2
          ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
          : '*'.repeat(localPart.length);
        return `${masked}@${domain}`;
        
      case 'phone':
        if (data.length < 4) return '*'.repeat(data.length);
        return '*'.repeat(data.length - 4) + data.slice(-4);
        
      case 'ssn':
        if (data.length < 4) return '*'.repeat(data.length);
        return '*'.repeat(data.length - 4) + data.slice(-4);
        
      case 'credit_card':
        if (data.length < 8) return '*'.repeat(data.length);
        return data.slice(0, 4) + '*'.repeat(data.length - 8) + data.slice(-4);
        
      default:
        return '*'.repeat(data.length);
    }
  }
}

// Export stubs for client-side use
export const cryptoService = new CryptoService('');
export const fieldEncryption = new FieldEncryption('');
export const passwordHasher = new PasswordHasher();
export const tokenManager = new TokenManager('');
export const sessionManager = new SecureSessionManager('');
export const piiProtection = new PIIProtection('');