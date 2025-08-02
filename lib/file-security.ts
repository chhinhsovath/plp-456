import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { AppError, ValidationError } from './error-handler';
import { sanitizePath } from './sanitization';

// File type definitions
interface FileTypeInfo {
  extension: string;
  mimeType: string;
  magicNumbers: Buffer[];
}

// Magic numbers for file type detection
const FILE_SIGNATURES: Record<string, FileTypeInfo> = {
  jpeg: {
    extension: '.jpg',
    mimeType: 'image/jpeg',
    magicNumbers: [
      Buffer.from([0xFF, 0xD8, 0xFF]),
    ],
  },
  png: {
    extension: '.png',
    mimeType: 'image/png',
    magicNumbers: [
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    ],
  },
  gif: {
    extension: '.gif',
    mimeType: 'image/gif',
    magicNumbers: [
      Buffer.from('GIF87a', 'ascii'),
      Buffer.from('GIF89a', 'ascii'),
    ],
  },
  pdf: {
    extension: '.pdf',
    mimeType: 'application/pdf',
    magicNumbers: [
      Buffer.from('%PDF-', 'ascii'),
    ],
  },
  docx: {
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magicNumbers: [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP format
    ],
  },
  mp4: {
    extension: '.mp4',
    mimeType: 'video/mp4',
    magicNumbers: [
      Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]),
      Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]),
    ],
  },
};

// Security configuration
export interface FileSecurityConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForVirus?: boolean;
  stripMetadata?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: { width: number; height: number };
  storageBasePath: string;
  quarantinePath?: string;
}

const defaultConfig: FileSecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.mp4'],
  scanForVirus: false,
  stripMetadata: true,
  generateThumbnail: true,
  thumbnailSize: { width: 200, height: 200 },
  storageBasePath: './uploads',
  quarantinePath: './quarantine',
};

export class FileSecurityValidator {
  private config: FileSecurityConfig;

  constructor(config: Partial<FileSecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Validate file before processing
  async validateFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check file size
    if (buffer.length > this.config.maxFileSize) {
      errors.push(`File size ${buffer.length} exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    // Sanitize filename
    const sanitizedFileName = this.sanitizeFileName(fileName);
    if (sanitizedFileName !== fileName) {
      errors.push('Filename contains invalid characters');
    }

    // Validate extension
    const ext = path.extname(sanitizedFileName).toLowerCase();
    if (!this.config.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} is not allowed`);
    }

    // Validate MIME type
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      errors.push(`MIME type ${mimeType} is not allowed`);
    }

    // Validate magic numbers
    const detectedType = await this.detectFileType(buffer);
    if (!detectedType) {
      errors.push('Could not determine file type from content');
    } else if (detectedType.mimeType !== mimeType) {
      errors.push(`MIME type mismatch: declared ${mimeType}, detected ${detectedType.mimeType}`);
    }

    // Check for embedded threats
    const threats = await this.scanForThreats(buffer);
    if (threats.length > 0) {
      errors.push(...threats);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Detect file type from magic numbers
  private async detectFileType(buffer: Buffer): Promise<FileTypeInfo | null> {
    for (const [type, info] of Object.entries(FILE_SIGNATURES)) {
      for (const magic of info.magicNumbers) {
        if (buffer.subarray(0, magic.length).equals(magic)) {
          return info;
        }
      }
    }
    return null;
  }

  // Scan for potential threats
  private async scanForThreats(buffer: Buffer): Promise<string[]> {
    const threats: string[] = [];

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script[\s>]/i,
      /<iframe[\s>]/i,
      /javascript:/i,
      /vbscript:/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
      /\.exe$/i,
      /\.dll$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.pif$/i,
    ];

    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 8192));
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        threats.push(`Suspicious pattern detected: ${pattern}`);
      }
    }

    // Check for null bytes (potential path traversal)
    if (buffer.includes(0x00)) {
      threats.push('File contains null bytes');
    }

    // For ZIP-based formats (docx, etc.), check for suspicious file names
    if (buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
      const zipThreats = await this.scanZipFile(buffer);
      threats.push(...zipThreats);
    }

    return threats;
  }

  // Scan ZIP-based files for threats
  private async scanZipFile(buffer: Buffer): Promise<string[]> {
    const threats: string[] = [];
    
    // Simple ZIP structure check
    // In production, use a proper ZIP library
    const content = buffer.toString('latin1');
    
    // Check for suspicious file extensions in ZIP
    const suspiciousExtensions = [
      '.exe', '.dll', '.bat', '.cmd', '.scr', '.vbs', '.pif',
      '.js', '.jse', '.wsf', '.wsh', '.ps1', '.com',
    ];
    
    for (const ext of suspiciousExtensions) {
      if (content.includes(ext)) {
        threats.push(`ZIP file may contain dangerous file type: ${ext}`);
      }
    }

    return threats;
  }

  // Sanitize filename
  sanitizeFileName(fileName: string): string {
    // Remove path components
    const baseName = path.basename(fileName);
    
    // Replace spaces and special characters
    let sanitized = baseName
      .replace(/[^\w\s.-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.+/g, '.') // Remove multiple dots
      .replace(/^\.+/, ''); // Remove leading dots

    // Ensure it has an extension
    if (!path.extname(sanitized)) {
      sanitized += '.unknown';
    }

    // Limit length
    const maxLength = 255;
    if (sanitized.length > maxLength) {
      const ext = path.extname(sanitized);
      const nameWithoutExt = sanitized.slice(0, sanitized.length - ext.length);
      sanitized = nameWithoutExt.slice(0, maxLength - ext.length) + ext;
    }

    return sanitized;
  }

  // Process uploaded file securely
  async processUpload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    userId: string
  ): Promise<{
    filePath: string;
    thumbnailPath?: string;
    metadata: Record<string, any>;
  }> {
    // Validate file
    const validation = await this.validateFile(buffer, fileName, mimeType);
    if (!validation.isValid) {
      throw new ValidationError(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const sanitizedName = this.sanitizeFileName(fileName);
    const ext = path.extname(sanitizedName);
    const secureFileName = `${userId}_${timestamp}_${randomBytes}${ext}`;

    // Strip metadata if configured
    let processedBuffer = buffer;
    if (this.config.stripMetadata && mimeType.startsWith('image/')) {
      processedBuffer = await this.stripImageMetadata(buffer, mimeType);
    }

    // Create secure storage path
    const storagePath = await this.createSecureStoragePath(userId);
    const filePath = path.join(storagePath, secureFileName);

    // Save file
    await fs.writeFile(filePath, processedBuffer);

    // Generate thumbnail if configured
    let thumbnailPath: string | undefined;
    if (this.config.generateThumbnail && mimeType.startsWith('image/')) {
      thumbnailPath = await this.generateThumbnail(filePath, storagePath, secureFileName);
    }

    // Calculate file hash
    const fileHash = crypto.createHash('sha256').update(processedBuffer).digest('hex');

    return {
      filePath,
      thumbnailPath,
      metadata: {
        originalName: fileName,
        secureFileName,
        mimeType,
        size: processedBuffer.length,
        hash: fileHash,
        uploadedAt: new Date().toISOString(),
        userId,
      },
    };
  }

  // Strip metadata from images
  private async stripImageMetadata(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      if (!mimeType.startsWith('image/')) {
        return buffer;
      }

      // Use sharp to remove metadata
      const processed = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .withMetadata({
          // Remove all metadata except basic info
          orientation: undefined,
          exif: {},
          icc: undefined,
          iptc: {},
          xmp: {},
        })
        .toBuffer();

      return processed;
    } catch (error) {
      // If stripping fails, return original
      console.error('Failed to strip metadata:', error);
      return buffer;
    }
  }

  // Generate thumbnail
  private async generateThumbnail(
    filePath: string,
    storagePath: string,
    fileName: string
  ): Promise<string> {
    try {
      const thumbFileName = `thumb_${fileName}`;
      const thumbPath = path.join(storagePath, thumbFileName);

      await sharp(filePath)
        .resize(
          this.config.thumbnailSize?.width || 200,
          this.config.thumbnailSize?.height || 200,
          {
            fit: 'inside',
            withoutEnlargement: true,
          }
        )
        .toFile(thumbPath);

      return thumbPath;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      throw new AppError('Failed to generate thumbnail', 500, 'THUMBNAIL_ERROR');
    }
  }

  // Create secure storage path
  private async createSecureStoragePath(userId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Create nested directory structure
    const storagePath = path.join(
      this.config.storageBasePath,
      year.toString(),
      month,
      userId
    );

    // Ensure directory exists
    await fs.mkdir(storagePath, { recursive: true, mode: 0o750 });

    return storagePath;
  }

  // Quarantine suspicious file
  async quarantineFile(
    buffer: Buffer,
    fileName: string,
    reason: string
  ): Promise<void> {
    if (!this.config.quarantinePath) {
      return;
    }

    const timestamp = Date.now();
    const quarantineFileName = `${timestamp}_${this.sanitizeFileName(fileName)}`;
    const quarantinePath = path.join(this.config.quarantinePath, quarantineFileName);

    // Ensure quarantine directory exists
    await fs.mkdir(this.config.quarantinePath, { recursive: true, mode: 0o700 });

    // Save file with metadata
    await fs.writeFile(quarantinePath, buffer);
    await fs.writeFile(
      `${quarantinePath}.json`,
      JSON.stringify({
        originalFileName: fileName,
        reason,
        timestamp: new Date().toISOString(),
      }, null, 2)
    );
  }

  // Verify file integrity
  async verifyFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      return hash === expectedHash;
    } catch (error) {
      return false;
    }
  }

  // Secure file deletion
  async secureDelete(filePath: string): Promise<void> {
    try {
      // Overwrite file with random data before deletion
      const stats = await fs.stat(filePath);
      const randomData = crypto.randomBytes(stats.size);
      await fs.writeFile(filePath, randomData);
      
      // Delete the file
      await fs.unlink(filePath);
    } catch (error) {
      throw new AppError('Failed to securely delete file', 500, 'DELETE_ERROR');
    }
  }
}

// File upload rate limiting
export class FileUploadRateLimiter {
  private uploads: Map<string, { count: number; size: number; resetTime: number }> = new Map();
  
  constructor(
    private config: {
      maxUploadsPerHour: number;
      maxSizePerHour: number;
      windowMs: number;
    }
  ) {}

  async checkLimit(userId: string, fileSize: number): Promise<boolean> {
    const now = Date.now();
    const userLimits = this.uploads.get(userId);

    if (!userLimits || userLimits.resetTime < now) {
      this.uploads.set(userId, {
        count: 1,
        size: fileSize,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (userLimits.count >= this.config.maxUploadsPerHour) {
      return false;
    }

    if (userLimits.size + fileSize > this.config.maxSizePerHour) {
      return false;
    }

    userLimits.count++;
    userLimits.size += fileSize;
    return true;
  }
}

// Export default instance
export const fileSecurityValidator = new FileSecurityValidator();
export const uploadRateLimiter = new FileUploadRateLimiter({
  maxUploadsPerHour: 20,
  maxSizePerHour: 100 * 1024 * 1024, // 100MB
  windowMs: 60 * 60 * 1000, // 1 hour
});