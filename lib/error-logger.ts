import { prisma } from '@/lib/prisma';

export interface ErrorLogEntry {
  id?: string;
  timestamp: Date;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  source: 'CLIENT' | 'SERVER' | 'DATABASE' | 'EXTERNAL';
  errorCode?: string;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorRate: number;
  recentErrors: ErrorLogEntry[];
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private buffer: ErrorLogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private intervalId?: NodeJS.Timeout;

  private constructor() {
    this.startBufferFlush();
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public async log(entry: Omit<ErrorLogEntry, 'timestamp'>): Promise<void> {
    const errorEntry: ErrorLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Add to buffer
    this.buffer.push(errorEntry);

    // Immediate flush for critical errors
    if (entry.level === 'ERROR' && this.buffer.length > 10) {
      await this.flush();
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(errorEntry);
    }
  }

  public async error(
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'ERROR',
      message,
      source: 'SERVER',
      stackTrace: error?.stack,
      errorCode: error?.name,
      metadata: {
        ...metadata,
        errorMessage: error?.message,
      },
    });
  }

  public async warn(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'WARN',
      message,
      source: 'SERVER',
      metadata,
    });
  }

  public async info(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'INFO',
      message,
      source: 'SERVER',
      metadata,
    });
  }

  public async debug(
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await this.log({
        level: 'DEBUG',
        message,
        source: 'SERVER',
        metadata,
      });
    }
  }

  public async logClientError(
    message: string,
    stackTrace?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'ERROR',
      message,
      source: 'CLIENT',
      stackTrace,
      metadata,
    });
  }

  public async logDatabaseError(
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'ERROR',
      message,
      source: 'DATABASE',
      stackTrace: error?.stack,
      errorCode: error?.name,
      metadata: {
        ...metadata,
        errorMessage: error?.message,
      },
    });
  }

  public async logExternalServiceError(
    service: string,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      level: 'ERROR',
      message: `External service error (${service}): ${message}`,
      source: 'EXTERNAL',
      stackTrace: error?.stack,
      errorCode: error?.name,
      metadata: {
        ...metadata,
        service,
        errorMessage: error?.message,
      },
    });
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.source}]`;
    
    switch (entry.level) {
      case 'ERROR':
        console.error(`${prefix} ${entry.message}`, entry.metadata || '');
        if (entry.stackTrace) {
          console.error(entry.stackTrace);
        }
        break;
      case 'WARN':
        console.warn(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      case 'INFO':
        console.info(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      case 'DEBUG':
        console.debug(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
    }
  }

  private startBufferFlush(): void {
    this.intervalId = setInterval(async () => {
      if (this.buffer.length > 0) {
        await this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // Batch insert to database
      await this.saveToDatabaseBatch(entries);
    } catch (error) {
      console.error('Failed to flush error logs to database:', error);
      // Put entries back in buffer for retry
      this.buffer = [...entries, ...this.buffer];
    }
  }

  private async saveToDatabaseBatch(entries: ErrorLogEntry[]): Promise<void> {
    try {
      // Note: This assumes you have an ErrorLog model in your Prisma schema
      // You would need to add this to your schema.prisma file
      /*
      await prisma.errorLog.createMany({
        data: entries.map(entry => ({
          timestamp: entry.timestamp,
          level: entry.level,
          message: entry.message,
          source: entry.source,
          errorCode: entry.errorCode,
          stackTrace: entry.stackTrace,
          userId: entry.userId,
          sessionId: entry.sessionId,
          requestId: entry.requestId,
          url: entry.url,
          userAgent: entry.userAgent,
          ip: entry.ip,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        })),
        skipDuplicates: true,
      });
      */
      
      // For now, just log to console in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Error batch to be saved:', entries.length, 'entries');
      }
    } catch (error) {
      console.error('Database error logging failed:', error);
      throw error;
    }
  }

  public async getErrorMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<ErrorMetrics> {
    try {
      const where = {
        level: 'ERROR' as const,
        ...(startDate && endDate && {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        }),
      };

      // Note: These queries assume you have an ErrorLog model
      // For now, return mock data
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySource: {},
        errorRate: 0,
        recentErrors: [],
      };

      /*
      const [totalErrors, errorsByCode, errorsBySource, recentErrors] = await Promise.all([
        prisma.errorLog.count({ where }),
        prisma.errorLog.groupBy({
          by: ['errorCode'],
          where,
          _count: { errorCode: true },
        }),
        prisma.errorLog.groupBy({
          by: ['source'],
          where,
          _count: { source: true },
        }),
        prisma.errorLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: 10,
        }),
      ]);

      const errorsByType = errorsByCode.reduce((acc, item) => {
        acc[item.errorCode || 'UNKNOWN'] = item._count.errorCode;
        return acc;
      }, {} as Record<string, number>);

      const errorsBySourceMap = errorsBySource.reduce((acc, item) => {
        acc[item.source] = item._count.source;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalErrors,
        errorsByType,
        errorsBySource: errorsBySourceMap,
        errorRate: totalErrors / (24 * 60), // errors per minute (assuming 24h period)
        recentErrors,
      };
      */
    } catch (error) {
      console.error('Failed to get error metrics:', error);
      throw error;
    }
  }

  public async cleanup(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Note: This assumes you have an ErrorLog model
      /*
      const result = await prisma.errorLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
      */
      
      return 0;
    } catch (error) {
      console.error('Failed to cleanup old error logs:', error);
      throw error;
    }
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Flush remaining entries
    this.flush().catch(console.error);
  }
}

// Global error logger instance
export const errorLogger = ErrorLogger.getInstance();

// Utility functions for common error logging patterns
export async function logApiError(
  error: Error,
  context: {
    method: string;
    url: string;
    userId?: string;
    requestId?: string;
    statusCode?: number;
  }
): Promise<void> {
  await errorLogger.error(
    `API Error: ${context.method} ${context.url}`,
    error,
    {
      ...context,
      statusCode: context.statusCode || 500,
    }
  );
}

export async function logAuthError(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await errorLogger.error(
    `Authentication Error: ${message}`,
    undefined,
    {
      ...metadata,
      userId,
      category: 'authentication',
    }
  );
}

export async function logValidationError(
  field: string,
  value: any,
  rule: string,
  metadata?: Record<string, any>
): Promise<void> {
  await errorLogger.warn(
    `Validation Error: ${field} failed ${rule} validation`,
    {
      ...metadata,
      field,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      rule,
      category: 'validation',
    }
  );
}

export async function logPerformanceIssue(
  operation: string,
  duration: number,
  threshold: number,
  metadata?: Record<string, any>
): Promise<void> {
  await errorLogger.warn(
    `Performance Issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
    {
      ...metadata,
      operation,
      duration,
      threshold,
      category: 'performance',
    }
  );
}

// Client-side error logging (to be called from frontend)
export async function logClientErrorToServer(
  error: {
    message: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    userId?: string;
  }
): Promise<void> {
  try {
    await fetch('/api/errors/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(error),
    });
  } catch (logError) {
    console.error('Failed to log client error to server:', logError);
  }
}