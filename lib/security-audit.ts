import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cryptoService, piiProtection } from './encryption';

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE',
  LOGOUT = 'AUTH_LOGOUT',
  PASSWORD_CHANGE = 'AUTH_PASSWORD_CHANGE',
  PASSWORD_RESET = 'AUTH_PASSWORD_RESET',
  TWO_FACTOR_ENABLED = 'AUTH_2FA_ENABLED',
  TWO_FACTOR_DISABLED = 'AUTH_2FA_DISABLED',
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  
  // Authorization events
  ACCESS_GRANTED = 'AUTHZ_ACCESS_GRANTED',
  ACCESS_DENIED = 'AUTHZ_ACCESS_DENIED',
  PERMISSION_CHANGED = 'AUTHZ_PERMISSION_CHANGED',
  ROLE_CHANGED = 'AUTHZ_ROLE_CHANGED',
  
  // Data access events
  DATA_VIEW = 'DATA_VIEW',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SEC_SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'SEC_RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'SEC_INVALID_INPUT',
  FILE_UPLOAD = 'SEC_FILE_UPLOAD',
  FILE_DOWNLOAD = 'SEC_FILE_DOWNLOAD',
  SQL_INJECTION_ATTEMPT = 'SEC_SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'SEC_XSS_ATTEMPT',
  CSRF_ATTEMPT = 'SEC_CSRF_ATTEMPT',
  
  // System events
  SYSTEM_ERROR = 'SYS_ERROR',
  SYSTEM_WARNING = 'SYS_WARNING',
  CONFIG_CHANGE = 'SYS_CONFIG_CHANGE',
  SERVICE_START = 'SYS_SERVICE_START',
  SERVICE_STOP = 'SYS_SERVICE_STOP',
  
  // Compliance events
  PRIVACY_CONSENT_GIVEN = 'COMP_PRIVACY_CONSENT',
  PRIVACY_CONSENT_WITHDRAWN = 'COMP_PRIVACY_WITHDRAWN',
  DATA_RETENTION_DELETE = 'COMP_DATA_RETENTION',
  GDPR_REQUEST = 'COMP_GDPR_REQUEST',
}

// Severity levels
export enum AuditSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Audit log entry
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, any>;
  errorMessage?: string;
  requestId?: string;
  duration?: number;
}

export class SecurityAuditLogger {
  private buffer: AuditLogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.startBufferFlush();
  }

  // Log security event
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
      // Mask sensitive data
      userEmail: entry.userEmail ? await piiProtection.tokenize(entry.userEmail) : undefined,
      metadata: entry.metadata ? this.sanitizeMetadata(entry.metadata) : undefined,
    };

    // Add to buffer
    this.buffer.push(auditEntry);

    // Immediate flush for critical events
    if (entry.severity === AuditSeverity.CRITICAL || entry.severity === AuditSeverity.HIGH) {
      await this.flush();
    } else if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }

    // Real-time alerting for critical events
    if (entry.severity === AuditSeverity.CRITICAL) {
      await this.sendSecurityAlert(auditEntry);
    }
  }

  // Log authentication event
  async logAuth(
    eventType: AuditEventType,
    userId: string | undefined,
    success: boolean,
    req: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: success ? AuditSeverity.INFO : AuditSeverity.MEDIUM,
      userId,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
      action: eventType,
      result: success ? 'SUCCESS' : 'FAILURE',
      metadata,
    });
  }

  // Log data access
  async logDataAccess(
    action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT',
    resourceType: string,
    resourceId: string,
    userId: string,
    req: NextRequest,
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventTypeMap = {
      VIEW: AuditEventType.DATA_VIEW,
      CREATE: AuditEventType.DATA_CREATE,
      UPDATE: AuditEventType.DATA_UPDATE,
      DELETE: AuditEventType.DATA_DELETE,
      EXPORT: AuditEventType.DATA_EXPORT,
    };

    await this.log({
      eventType: eventTypeMap[action],
      severity: action === 'DELETE' || action === 'EXPORT' ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
      userId,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
      resourceType,
      resourceId,
      action: `${action} ${resourceType}`,
      result: success ? 'SUCCESS' : 'FAILURE',
      metadata,
    });
  }

  // Log security threat
  async logSecurityThreat(
    threatType: 'SQL_INJECTION' | 'XSS' | 'CSRF' | 'SUSPICIOUS_ACTIVITY',
    req: NextRequest,
    details: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventTypeMap = {
      SQL_INJECTION: AuditEventType.SQL_INJECTION_ATTEMPT,
      XSS: AuditEventType.XSS_ATTEMPT,
      CSRF: AuditEventType.CSRF_ATTEMPT,
      SUSPICIOUS_ACTIVITY: AuditEventType.SUSPICIOUS_ACTIVITY,
    };

    await this.log({
      eventType: eventTypeMap[threatType],
      severity: AuditSeverity.HIGH,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
      action: `${threatType} attempt detected`,
      result: 'FAILURE',
      errorMessage: details,
      metadata: {
        ...metadata,
        url: req.url,
        method: req.method,
        headers: this.sanitizeHeaders(req.headers),
      },
    });
  }

  // Log file operation
  async logFileOperation(
    operation: 'UPLOAD' | 'DOWNLOAD' | 'DELETE',
    fileName: string,
    userId: string,
    req: NextRequest,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: operation === 'UPLOAD' ? AuditEventType.FILE_UPLOAD : AuditEventType.FILE_DOWNLOAD,
      severity: AuditSeverity.MEDIUM,
      userId,
      ipAddress: this.getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
      action: `File ${operation.toLowerCase()}: ${fileName}`,
      result: success ? 'SUCCESS' : 'FAILURE',
      metadata: {
        ...metadata,
        fileName,
        operation,
      },
    });
  }

  // Get client IP address
  private getClientIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           'unknown';
  }

  // Sanitize metadata to remove sensitive information
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Sanitize headers
  private sanitizeHeaders(headers: Headers): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = ['content-type', 'accept', 'user-agent', 'referer', 'origin'];

    headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  // Flush buffer to storage
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // In production, save to database
      // await this.saveToDatabase(entries);
      
      // For now, log to console
      if (process.env.NODE_ENV === 'development') {
        console.log('Security Audit Logs:', entries);
      }
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Put entries back in buffer for retry
      this.buffer = [...entries, ...this.buffer];
    }
  }

  // Save to database (placeholder)
  private async saveToDatabase(entries: AuditLogEntry[]): Promise<void> {
    // In production, implement database storage
    // Example with Prisma:
    /*
    await prisma.auditLog.createMany({
      data: entries.map(entry => ({
        ...entry,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      })),
    });
    */
  }

  // Send security alert for critical events
  private async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, send to security team
      console.error('SECURITY ALERT:', {
        severity: entry.severity,
        event: entry.eventType,
        timestamp: entry.timestamp,
        ipAddress: entry.ipAddress,
        action: entry.action,
        error: entry.errorMessage,
      });

      // Send to monitoring service
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Security Alert: ${entry.eventType}`,
            severity: entry.severity,
            details: entry,
          }),
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // Start periodic buffer flush
  private startBufferFlush(): void {
    this.intervalId = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  // Stop the logger
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.flush().catch(console.error);
  }
}

// Compliance audit logger
export class ComplianceAuditLogger {
  private auditLogger: SecurityAuditLogger;

  constructor(auditLogger: SecurityAuditLogger) {
    this.auditLogger = auditLogger;
  }

  // Log consent event
  async logConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    req: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.auditLogger.log({
      eventType: granted 
        ? AuditEventType.PRIVACY_CONSENT_GIVEN 
        : AuditEventType.PRIVACY_CONSENT_WITHDRAWN,
      severity: AuditSeverity.MEDIUM,
      userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      action: `${consentType} consent ${granted ? 'granted' : 'withdrawn'}`,
      result: 'SUCCESS',
      metadata: {
        ...metadata,
        consentType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Log GDPR request
  async logGDPRRequest(
    userId: string,
    requestType: 'ACCESS' | 'DELETE' | 'PORTABILITY' | 'RECTIFICATION',
    req: NextRequest,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.auditLogger.log({
      eventType: AuditEventType.GDPR_REQUEST,
      severity: AuditSeverity.HIGH,
      userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || undefined,
      action: `GDPR ${requestType} request`,
      result: 'SUCCESS',
      metadata: {
        ...metadata,
        requestType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Log data retention deletion
  async logDataRetention(
    recordType: string,
    recordCount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.auditLogger.log({
      eventType: AuditEventType.DATA_RETENTION_DELETE,
      severity: AuditSeverity.MEDIUM,
      action: `Data retention: deleted ${recordCount} ${recordType} records`,
      result: 'SUCCESS',
      metadata: {
        ...metadata,
        recordType,
        recordCount,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Security metrics collector
export class SecurityMetricsCollector {
  private metrics: Map<string, number> = new Map();

  // Increment metric
  increment(metric: string, value: number = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  // Get metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Reset metrics
  reset(): void {
    this.metrics.clear();
  }

  // Common security metrics
  recordLoginAttempt(success: boolean): void {
    this.increment(success ? 'login.success' : 'login.failure');
  }

  recordSecurityThreat(type: string): void {
    this.increment(`threat.${type.toLowerCase()}`);
  }

  recordDataAccess(action: string): void {
    this.increment(`data.${action.toLowerCase()}`);
  }
}

// Global instances
export const securityAuditLogger = new SecurityAuditLogger();
export const complianceAuditLogger = new ComplianceAuditLogger(securityAuditLogger);
export const securityMetrics = new SecurityMetricsCollector();