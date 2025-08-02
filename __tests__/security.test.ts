import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { 
  sanitizeHtml, 
  stripHtml, 
  escapeSqlIdentifier,
  validateSqlIdentifier,
  sanitizeMongoQuery,
  sanitizePath,
  isValidPath,
  sanitizeShellArg,
  sanitizers 
} from '@/lib/sanitization';
import { 
  CryptoService, 
  PasswordHasher, 
  TokenManager,
  FieldEncryption 
} from '@/lib/encryption';
import { 
  FileSecurityValidator,
  FileUploadRateLimiter 
} from '@/lib/file-security';
import { 
  MemoryStore,
  SlidingWindowStore,
  rateLimit 
} from '@/lib/rate-limiter';

describe('Security Tests', () => {
  describe('Input Sanitization', () => {
    describe('XSS Prevention', () => {
      it('should sanitize HTML tags', () => {
        const input = '<script>alert("XSS")</script><p>Safe content</p>';
        const result = sanitizeHtml(input);
        expect(result).not.toContain('<script>');
        expect(result).toContain('<p>Safe content</p>');
      });

      it('should strip all HTML tags when requested', () => {
        const input = '<p>Text with <b>HTML</b> tags</p>';
        const result = stripHtml(input);
        expect(result).toBe('Text with HTML tags');
      });

      it('should handle malicious event handlers', () => {
        const input = '<img src="x" onerror="alert(\'XSS\')">';
        const result = sanitizeHtml(input);
        expect(result).not.toContain('onerror');
      });

      it('should preserve allowed attributes', () => {
        const input = '<a href="https://example.com" onclick="alert()">Link</a>';
        const result = sanitizeHtml(input);
        expect(result).toContain('href="https://example.com"');
        expect(result).not.toContain('onclick');
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should escape SQL identifiers', () => {
        const input = 'users; DROP TABLE users;--';
        const result = escapeSqlIdentifier(input);
        expect(result).toBe('usersDROPTABLEusers');
      });

      it('should validate SQL identifiers', () => {
        expect(validateSqlIdentifier('valid_table_name')).toBe(true);
        expect(validateSqlIdentifier('123invalid')).toBe(false);
        expect(validateSqlIdentifier('table-name')).toBe(false);
      });
    });

    describe('NoSQL Injection Prevention', () => {
      it('should remove MongoDB operators', () => {
        const query = {
          username: 'admin',
          password: { $ne: null },
          $where: 'this.password.length > 0'
        };
        const result = sanitizeMongoQuery(query);
        expect(result).toEqual({ username: 'admin', password: { $ne: null } });
        expect(result).not.toHaveProperty('$where');
      });

      it('should handle nested objects', () => {
        const query = {
          user: {
            name: 'test',
            $or: [{ admin: true }]
          }
        };
        const result = sanitizeMongoQuery(query);
        expect(result.user).toEqual({ name: 'test' });
      });
    });

    describe('Path Traversal Prevention', () => {
      it('should sanitize path traversal attempts', () => {
        expect(sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
        expect(sanitizePath('..\\..\\windows\\system32')).toBe('windows/system32');
        expect(sanitizePath('//etc//passwd')).toBe('etc/passwd');
      });

      it('should validate allowed paths', () => {
        const allowedPaths = ['uploads/', 'public/'];
        expect(isValidPath('uploads/file.jpg', allowedPaths)).toBe(true);
        expect(isValidPath('../private/secrets.txt', allowedPaths)).toBe(false);
      });
    });

    describe('Command Injection Prevention', () => {
      it('should escape shell arguments', () => {
        const arg = 'file.txt; rm -rf /';
        const result = sanitizeShellArg(arg);
        expect(result).toBe('file.txt\\;\\ rm\\ -rf\\ /');
      });

      it('should handle quotes and special characters', () => {
        const arg = '$(whoami) && echo "test"';
        const result = sanitizeShellArg(arg);
        expect(result).toContain('\\$');
        expect(result).toContain('\\"');
      });
    });

    describe('CSV Injection Prevention', () => {
      it('should prevent formula injection', () => {
        expect(sanitizers.csv('=1+1')).toBe("'=1+1");
        expect(sanitizers.csv('+1+1')).toBe("'+1+1");
        expect(sanitizers.csv('-1+1')).toBe("'-1+1");
        expect(sanitizers.csv('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
      });

      it('should escape CSV fields properly', () => {
        expect(sanitizers.csv('normal text')).toBe('normal text');
        expect(sanitizers.csv('text with, comma')).toBe('"text with, comma"');
        expect(sanitizers.csv('text with "quotes"')).toBe('"text with ""quotes"""');
      });
    });
  });

  describe('Encryption', () => {
    let cryptoService: CryptoService;
    const masterKey = Buffer.from('12345678901234567890123456789012').toString('base64');

    beforeEach(() => {
      cryptoService = new CryptoService(masterKey);
    });

    describe('Data Encryption', () => {
      it('should encrypt and decrypt data correctly', async () => {
        const plaintext = 'Sensitive information';
        const encrypted = await cryptoService.encrypt(plaintext);
        const decrypted = await cryptoService.decrypt(encrypted);
        
        expect(encrypted).not.toBe(plaintext);
        expect(decrypted).toBe(plaintext);
      });

      it('should produce different ciphertexts for same plaintext', async () => {
        const plaintext = 'Same data';
        const encrypted1 = await cryptoService.encrypt(plaintext);
        const encrypted2 = await cryptoService.encrypt(plaintext);
        
        expect(encrypted1).not.toBe(encrypted2);
      });

      it('should fail decryption with tampered data', async () => {
        const plaintext = 'Original data';
        const encrypted = await cryptoService.encrypt(plaintext);
        
        // Tamper with the encrypted data
        const tampered = encrypted.slice(0, -4) + 'XXXX';
        
        await expect(cryptoService.decrypt(tampered)).rejects.toThrow();
      });

      it('should encrypt and decrypt objects', async () => {
        const obj = { user: 'test', role: 'admin', permissions: ['read', 'write'] };
        const encrypted = await cryptoService.encryptObject(obj);
        const decrypted = await cryptoService.decryptObject(encrypted);
        
        expect(decrypted).toEqual(obj);
      });
    });

    describe('Password Hashing', () => {
      const passwordHasher = new PasswordHasher();

      it('should hash passwords securely', async () => {
        const password = 'SecurePassword123!';
        const hash = await passwordHasher.hash(password);
        
        expect(hash).not.toBe(password);
        expect(hash).toMatch(/^\$scrypt\$/);
      });

      it('should verify correct passwords', async () => {
        const password = 'CorrectPassword';
        const hash = await passwordHasher.hash(password);
        
        const isValid = await passwordHasher.verify(password, hash);
        expect(isValid).toBe(true);
      });

      it('should reject incorrect passwords', async () => {
        const password = 'CorrectPassword';
        const hash = await passwordHasher.hash(password);
        
        const isValid = await passwordHasher.verify('WrongPassword', hash);
        expect(isValid).toBe(false);
      });

      it('should generate unique hashes for same password', async () => {
        const password = 'SamePassword';
        const hash1 = await passwordHasher.hash(password);
        const hash2 = await passwordHasher.hash(password);
        
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('Field Encryption', () => {
      const fieldEncryption = new FieldEncryption(masterKey);

      it('should encrypt specific fields', async () => {
        const user = {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          ssn: '123-45-6789'
        };
        
        const encrypted = await fieldEncryption.encryptFields(user, ['email', 'ssn']);
        
        expect(encrypted.id).toBe(user.id);
        expect(encrypted.name).toBe(user.name);
        expect(encrypted.email).not.toBe(user.email);
        expect(encrypted.ssn).not.toBe(user.ssn);
      });

      it('should decrypt encrypted fields', async () => {
        const user = {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          ssn: '123-45-6789'
        };
        
        const encrypted = await fieldEncryption.encryptFields(user, ['email', 'ssn']);
        const decrypted = await fieldEncryption.decryptFields(encrypted, ['email', 'ssn']);
        
        expect(decrypted).toEqual(user);
      });
    });

    describe('Token Management', () => {
      const tokenManager = new TokenManager(masterKey, 3600);

      it('should generate and validate tokens', async () => {
        const payload = { userId: '123', role: 'user' };
        const token = await tokenManager.generateToken(payload);
        const validated = await tokenManager.validateToken(token);
        
        expect(validated).toEqual(payload);
      });

      it('should reject expired tokens', async () => {
        const shortLivedTokenManager = new TokenManager(masterKey, 0.001); // 1ms TTL
        const payload = { userId: '123' };
        const token = await shortLivedTokenManager.generateToken(payload);
        
        // Wait for token to expire
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const validated = await shortLivedTokenManager.validateToken(token);
        expect(validated).toBeNull();
      });

      it('should reject tampered tokens', async () => {
        const payload = { userId: '123' };
        const token = await tokenManager.generateToken(payload);
        const tampered = token.slice(0, -10) + 'tamperedXX';
        
        const validated = await tokenManager.validateToken(tampered);
        expect(validated).toBeNull();
      });
    });
  });

  describe('File Security', () => {
    const fileValidator = new FileSecurityValidator({
      maxFileSize: 1024 * 1024, // 1MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    });

    describe('File Validation', () => {
      it('should validate allowed file types', async () => {
        const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
        const result = await fileValidator.validateFile(jpegBuffer, 'test.jpg', 'image/jpeg');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject oversized files', async () => {
        const largeBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB
        const result = await fileValidator.validateFile(largeBuffer, 'large.jpg', 'image/jpeg');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('exceeds maximum allowed size'));
      });

      it('should reject disallowed extensions', async () => {
        const buffer = Buffer.from('content');
        const result = await fileValidator.validateFile(buffer, 'file.exe', 'application/exe');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('extension .exe is not allowed'));
      });

      it('should detect MIME type mismatch', async () => {
        const pdfBuffer = Buffer.from('%PDF-1.4');
        const result = await fileValidator.validateFile(pdfBuffer, 'fake.jpg', 'image/jpeg');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(expect.stringContaining('MIME type mismatch'));
      });

      it('should detect embedded scripts', async () => {
        const maliciousBuffer = Buffer.from('<script>alert("XSS")</script>');
        const result = await fileValidator.validateFile(maliciousBuffer, 'bad.html', 'text/html');
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Suspicious pattern'))).toBe(true);
      });

      it('should sanitize filenames', () => {
        expect(fileValidator.sanitizeFileName('../../../etc/passwd')).toBe('etcpasswd');
        expect(fileValidator.sanitizeFileName('file name with spaces.txt')).toBe('file_name_with_spaces.txt');
        expect(fileValidator.sanitizeFileName('file@#$%^&*.txt')).toBe('file.txt');
        expect(fileValidator.sanitizeFileName('.hidden')).toBe('hidden.unknown');
      });
    });

    describe('File Upload Rate Limiting', () => {
      const uploadLimiter = new FileUploadRateLimiter({
        maxUploadsPerHour: 5,
        maxSizePerHour: 10 * 1024 * 1024, // 10MB
        windowMs: 3600000,
      });

      it('should allow uploads within limits', async () => {
        const userId = 'user123';
        const fileSize = 1024 * 1024; // 1MB
        
        const allowed = await uploadLimiter.checkLimit(userId, fileSize);
        expect(allowed).toBe(true);
      });

      it('should block uploads exceeding count limit', async () => {
        const userId = 'user456';
        const fileSize = 1024; // 1KB
        
        // Upload 5 files (the limit)
        for (let i = 0; i < 5; i++) {
          await uploadLimiter.checkLimit(userId, fileSize);
        }
        
        // 6th upload should be blocked
        const allowed = await uploadLimiter.checkLimit(userId, fileSize);
        expect(allowed).toBe(false);
      });

      it('should block uploads exceeding size limit', async () => {
        const userId = 'user789';
        const largeFileSize = 11 * 1024 * 1024; // 11MB
        
        const allowed = await uploadLimiter.checkLimit(userId, largeFileSize);
        expect(allowed).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    describe('Memory Store', () => {
      it('should track request counts', async () => {
        const store = new MemoryStore(60000);
        const key = 'test-user';
        
        const info1 = await store.increment(key);
        expect(info1.current).toBe(1);
        
        const info2 = await store.increment(key);
        expect(info2.current).toBe(2);
      });

      it('should reset after window expires', async () => {
        const store = new MemoryStore(100); // 100ms window
        const key = 'test-user';
        
        await store.increment(key);
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const info = await store.increment(key);
        expect(info.current).toBe(1);
      });

      it('should decrement count', async () => {
        const store = new MemoryStore(60000);
        const key = 'test-user';
        
        await store.increment(key);
        await store.increment(key);
        await store.decrement(key);
        
        const info = await store.increment(key);
        expect(info.current).toBe(2);
      });
    });

    describe('Rate Limit Middleware', () => {
      it('should allow requests within limit', async () => {
        const limiter = rateLimit({ windowMs: 60000, max: 2 });
        const req = new NextRequest('http://localhost/api/test');
        const next = jest.fn().mockResolvedValue(new NextResponse());
        
        await limiter(req, next);
        expect(next).toHaveBeenCalled();
      });

      it('should block requests exceeding limit', async () => {
        const limiter = rateLimit({ windowMs: 60000, max: 1 });
        const req = new NextRequest('http://localhost/api/test');
        const next = jest.fn().mockResolvedValue(new NextResponse());
        
        // First request should pass
        await limiter(req, next);
        
        // Second request should be blocked
        const response = await limiter(req, next);
        expect(response.status).toBe(429);
      });

      it('should add rate limit headers', async () => {
        const limiter = rateLimit({ 
          windowMs: 60000, 
          max: 10,
          standardHeaders: true,
          legacyHeaders: true 
        });
        const req = new NextRequest('http://localhost/api/test');
        const next = jest.fn().mockResolvedValue(new NextResponse());
        
        const response = await limiter(req, next);
        
        expect(response.headers.get('RateLimit-Limit')).toBe('10');
        expect(response.headers.get('RateLimit-Remaining')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      });
    });

    describe('Sliding Window Store', () => {
      it('should implement sliding window algorithm', async () => {
        const store = new SlidingWindowStore(1000, 3); // 1s window, 3 requests
        const key = 'test-user';
        
        // Make 3 requests
        for (let i = 0; i < 3; i++) {
          const info = await store.increment(key);
          expect(info.current).toBe(i + 1);
          expect(info.remaining).toBe(3 - i - 1);
        }
        
        // 4th request should show limit reached
        const info = await store.increment(key);
        expect(info.current).toBe(4);
        expect(info.remaining).toBe(0);
      });
    });
  });

  describe('CORS', () => {
    const { cors, isOriginAllowed } = require('@/lib/cors');

    describe('Origin Validation', () => {
      it('should validate allowed origins', () => {
        const allowedOrigins = ['https://example.com', 'https://app.example.com'];
        
        expect(isOriginAllowed('https://example.com', allowedOrigins)).toBe(true);
        expect(isOriginAllowed('https://app.example.com', allowedOrigins)).toBe(true);
        expect(isOriginAllowed('https://evil.com', allowedOrigins)).toBe(false);
      });

      it('should handle wildcard patterns', () => {
        const allowedOrigins = ['https://*.example.com', 'http://localhost:*'];
        
        expect(isOriginAllowed('https://app.example.com', allowedOrigins)).toBe(true);
        expect(isOriginAllowed('https://api.example.com', allowedOrigins)).toBe(true);
        expect(isOriginAllowed('http://localhost:3000', allowedOrigins)).toBe(true);
        expect(isOriginAllowed('https://example.org', allowedOrigins)).toBe(false);
      });
    });

    describe('CORS Headers', () => {
      it('should set appropriate CORS headers', async () => {
        const req = new NextRequest('http://localhost/api/test', {
          headers: { 'origin': 'https://example.com' }
        });
        const res = new NextResponse();
        
        const result = await cors(req, res, {
          origin: ['https://example.com'],
          credentials: true,
          exposedHeaders: ['X-Total-Count']
        });
        
        expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
        expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true');
        expect(result.headers.get('Access-Control-Expose-Headers')).toBe('X-Total-Count');
      });

      it('should handle preflight requests', async () => {
        const req = new NextRequest('http://localhost/api/test', {
          method: 'OPTIONS',
          headers: {
            'origin': 'https://example.com',
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'content-type'
          }
        });
        const res = new NextResponse();
        
        const result = await cors(req, res, {
          origin: '*',
          methods: ['GET', 'POST'],
          maxAge: 86400
        });
        
        expect(result.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
        expect(result.headers.get('Access-Control-Max-Age')).toBe('86400');
      });
    });
  });

  describe('Security Audit Logging', () => {
    const { SecurityAuditLogger, AuditEventType, AuditSeverity } = require('@/lib/security-audit');

    it('should log security events with proper format', async () => {
      const logger = new SecurityAuditLogger();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await logger.log({
        eventType: AuditEventType.LOGIN_SUCCESS,
        severity: AuditSeverity.INFO,
        userId: 'user123',
        userEmail: 'user@example.com',
        action: 'User login',
        result: 'SUCCESS',
        metadata: { browser: 'Chrome' }
      });
      
      // Force flush
      await logger['flush']();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should sanitize sensitive metadata', () => {
      const logger = new SecurityAuditLogger();
      const metadata = {
        username: 'john',
        password: 'secret123',
        token: 'bearer-token',
        data: 'safe-data'
      };
      
      const sanitized = logger['sanitizeMetadata'](metadata);
      
      expect(sanitized.username).toBe('john');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.data).toBe('safe-data');
    });

    it('should trigger alerts for critical events', async () => {
      const logger = new SecurityAuditLogger();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await logger.log({
        eventType: AuditEventType.SQL_INJECTION_ATTEMPT,
        severity: AuditSeverity.CRITICAL,
        action: 'SQL injection detected',
        result: 'FAILURE',
        errorMessage: 'Malicious SQL detected'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY ALERT:',
        expect.objectContaining({
          severity: AuditSeverity.CRITICAL,
          event: AuditEventType.SQL_INJECTION_ATTEMPT
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});