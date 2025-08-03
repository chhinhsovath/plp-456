import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

// Encryption configuration
interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
  iterations: number;
}

const defaultConfig: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  saltLength: 32,
  ivLength: 16,
  tagLength: 16,
  iterations: 100000,
};

export class CryptoService {
  private config: EncryptionConfig;
  private masterKey: Buffer;

  constructor(
    masterKeyBase64: string,
    config: Partial<EncryptionConfig> = {}
  ) {
    this.config = { ...defaultConfig, ...config };
    
    // Validate master key
    if (!masterKeyBase64) {
      throw new Error('Master key is required');
    }
    
    this.masterKey = Buffer.from(masterKeyBase64, 'base64');
    
    if (this.masterKey.length !== this.config.keyLength) {
      throw new Error(`Master key must be ${this.config.keyLength} bytes`);
    }
  }

  // Encrypt data
  async encrypt(plaintext: string | Buffer): Promise<string> {
    try {
      const salt = crypto.randomBytes(this.config.saltLength);
      const iv = crypto.randomBytes(this.config.ivLength);
      
      // Derive key from master key and salt
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.config.algorithm, key, iv);
      
      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8')),
        cipher.final(),
      ]);
      
      // Get auth tag for GCM mode
      const tag = (cipher as any).getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, encrypted]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  // Decrypt data
  async decrypt(encryptedData: string): Promise<string> {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, this.config.saltLength);
      const iv = combined.subarray(this.config.saltLength, this.config.saltLength + this.config.ivLength);
      const tag = combined.subarray(
        this.config.saltLength + this.config.ivLength,
        this.config.saltLength + this.config.ivLength + this.config.tagLength
      );
      const encrypted = combined.subarray(this.config.saltLength + this.config.ivLength + this.config.tagLength);
      
      // Derive key from master key and salt
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.config.algorithm, key, iv);
      (decipher as any).setAuthTag(tag);
      
      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  // Derive key from master key and salt
  private async deriveKey(masterKey: Buffer, salt: Buffer): Promise<Buffer> {
    const key = await scrypt(masterKey, salt, this.config.keyLength) as Buffer;
    return key;
  }

  // Encrypt object (JSON)
  async encryptObject<T>(obj: T): Promise<string> {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  // Decrypt object (JSON)
  async decryptObject<T>(encryptedData: string): Promise<T> {
    const json = await this.decrypt(encryptedData);
    return JSON.parse(json);
  }

  // Hash data (one-way)
  hash(data: string | Buffer, algorithm: string = 'sha256'): string {
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest('hex');
  }

  // Hash with HMAC
  hmac(data: string | Buffer, key: string | Buffer, algorithm: string = 'sha256'): string {
    return crypto
      .createHmac(algorithm, key)
      .update(data)
      .digest('hex');
  }

  // Generate secure random token
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure random ID
  generateId(): string {
    return crypto.randomUUID();
  }

  // Time-constant comparison to prevent timing attacks
  timingSafeEqual(a: string | Buffer, b: string | Buffer): boolean {
    const bufferA = Buffer.isBuffer(a) ? a : Buffer.from(a);
    const bufferB = Buffer.isBuffer(b) ? b : Buffer.from(b);
    
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  }
}

// Field-level encryption for database
export class FieldEncryption {
  private crypto: CryptoService;

  constructor(masterKey: string) {
    this.crypto = new CryptoService(masterKey);
  }

  // Encrypt specific fields in an object
  async encryptFields<T extends Record<string, any>>(
    obj: T,
    fields: Array<keyof T>
  ): Promise<T> {
    const encrypted = { ...obj };
    
    for (const field of fields) {
      if (obj[field] !== null && obj[field] !== undefined) {
        encrypted[field] = await this.crypto.encrypt(String(obj[field])) as any;
      }
    }
    
    return encrypted;
  }

  // Decrypt specific fields in an object
  async decryptFields<T extends Record<string, any>>(
    obj: T,
    fields: Array<keyof T>
  ): Promise<T> {
    const decrypted = { ...obj };
    
    for (const field of fields) {
      if (obj[field] !== null && obj[field] !== undefined) {
        try {
          decrypted[field] = await this.crypto.decrypt(String(obj[field])) as any;
        } catch (error) {
          // If decryption fails, field might not be encrypted
          console.warn(`Failed to decrypt field ${String(field)}`);
        }
      }
    }
    
    return decrypted;
  }

  // Encrypt sensitive array items
  async encryptArray<T>(items: T[]): Promise<string[]> {
    return Promise.all(items.map(item => this.crypto.encryptObject(item)));
  }

  // Decrypt sensitive array items
  async decryptArray<T>(encryptedItems: string[]): Promise<T[]> {
    return Promise.all(encryptedItems.map(item => this.crypto.decryptObject<T>(item)));
  }
}

// Password hashing (using bcrypt algorithm with crypto)
export class PasswordHasher {
  private rounds: number;

  constructor(rounds: number = 12) {
    this.rounds = rounds;
  }

  // Hash password
  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    
    // Use default scrypt parameters - the rounds parameter was meant for bcrypt-style cost factor
    const hash = await scrypt(password, salt, 64) as Buffer;
    
    // Format: $scrypt$rounds$salt$hash
    return `$scrypt$${this.rounds}$${salt.toString('base64')}$${hash.toString('base64')}`;
  }

  // Verify password
  async verify(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const parts = hashedPassword.split('$');
      if (parts.length !== 5 || parts[1] !== 'scrypt') {
        return false;
      }
      
      const rounds = parseInt(parts[2], 10);
      const salt = Buffer.from(parts[3], 'base64');
      const storedHash = Buffer.from(parts[4], 'base64');
      
      // Use default scrypt parameters for consistency
      const hash = await scrypt(password, salt, 64) as Buffer;
      
      return crypto.timingSafeEqual(hash, storedHash);
    } catch (error) {
      return false;
    }
  }
}

// Token manager for secure token generation and validation
export class TokenManager {
  private crypto: CryptoService;
  private ttl: number;

  constructor(masterKey: string, ttlSeconds: number = 3600) {
    this.crypto = new CryptoService(masterKey);
    this.ttl = ttlSeconds * 1000;
  }

  // Generate secure token with payload
  async generateToken(payload: any): Promise<string> {
    const tokenData = {
      payload,
      expiresAt: Date.now() + this.ttl,
      nonce: crypto.randomBytes(16).toString('hex'),
    };
    
    return this.crypto.encryptObject(tokenData);
  }

  // Validate and decrypt token
  async validateToken<T = any>(token: string): Promise<T | null> {
    try {
      const tokenData = await this.crypto.decryptObject<{
        payload: T;
        expiresAt: number;
        nonce: string;
      }>(token);
      
      if (Date.now() > tokenData.expiresAt) {
        return null;
      }
      
      return tokenData.payload;
    } catch (error) {
      return null;
    }
  }

  // Revoke token (would need Redis or database in production)
  async revokeToken(token: string): Promise<void> {
    // In production, store revoked tokens in Redis with TTL
    // For now, this is a placeholder
  }
}

// Secure session management
export class SecureSessionManager {
  private crypto: CryptoService;
  private sessionTTL: number;

  constructor(masterKey: string, sessionTTLSeconds: number = 86400) {
    this.crypto = new CryptoService(masterKey);
    this.sessionTTL = sessionTTLSeconds;
  }

  // Create secure session
  async createSession(userId: string, metadata: any = {}): Promise<{
    sessionId: string;
    sessionToken: string;
  }> {
    const sessionId = this.crypto.generateId();
    const sessionData = {
      sessionId,
      userId,
      metadata,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.sessionTTL * 1000),
    };
    
    const sessionToken = await this.crypto.encryptObject(sessionData);
    
    return { sessionId, sessionToken };
  }

  // Validate session
  async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    userId?: string;
    sessionId?: string;
    metadata?: any;
  }> {
    try {
      const sessionData = await this.crypto.decryptObject<{
        sessionId: string;
        userId: string;
        metadata: any;
        createdAt: number;
        expiresAt: number;
      }>(sessionToken);
      
      if (Date.now() > sessionData.expiresAt) {
        return { valid: false };
      }
      
      return {
        valid: true,
        userId: sessionData.userId,
        sessionId: sessionData.sessionId,
        metadata: sessionData.metadata,
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

// PII (Personally Identifiable Information) protection
export class PIIProtection {
  private crypto: CryptoService;
  private tokenizer: Map<string, string> = new Map();

  constructor(masterKey: string) {
    this.crypto = new CryptoService(masterKey);
  }

  // Tokenize PII data
  async tokenize(piiData: string): Promise<string> {
    // Check if already tokenized
    const existingToken = Array.from(this.tokenizer.entries())
      .find(([_, data]) => data === piiData)?.[0];
    
    if (existingToken) {
      return existingToken;
    }
    
    // Generate new token
    const token = `pii_${this.crypto.generateToken(16)}`;
    const encrypted = await this.crypto.encrypt(piiData);
    
    // Store mapping (in production, use secure storage)
    this.tokenizer.set(token, encrypted);
    
    return token;
  }

  // Detokenize PII data
  async detokenize(token: string): Promise<string | null> {
    const encrypted = this.tokenizer.get(token);
    if (!encrypted) {
      return null;
    }
    
    return this.crypto.decrypt(encrypted);
  }

  // Mask PII for display
  maskPII(data: string, type: 'email' | 'phone' | 'ssn' | 'credit_card'): string {
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

// Initialize crypto services
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || '';

if (!MASTER_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_MASTER_KEY environment variable is required in production');
}

// Generate a key for development if not provided
const masterKey = MASTER_KEY || crypto.randomBytes(32).toString('base64');

export const cryptoService = new CryptoService(masterKey);
export const fieldEncryption = new FieldEncryption(masterKey);
export const passwordHasher = new PasswordHasher();
export const tokenManager = new TokenManager(masterKey);
export const sessionManager = new SecureSessionManager(masterKey);
export const piiProtection = new PIIProtection(masterKey);