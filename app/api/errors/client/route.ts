import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, ValidationError } from '@/lib/error-handler';
import { errorLogger } from '@/lib/error-logger';
import { z } from 'zod';

const ClientErrorSchema = z.object({
  message: z.string().min(1, 'Error message is required').max(1000, 'Error message too long'),
  stack: z.string().max(5000, 'Stack trace too long').optional(),
  url: z.string().url('Invalid URL').optional(),
  userAgent: z.string().max(500, 'User agent too long').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  errorId: z.string().max(100, 'Error ID too long').optional(),
  level: z.enum(['ERROR', 'WARN', 'INFO']).default('ERROR'),
  source: z.string().max(100, 'Source too long').default('CLIENT'),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const clientError = ClientErrorSchema.parse(body);

    // Extract client IP and additional headers
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const referer = req.headers.get('referer');
    const userAgent = req.headers.get('user-agent') || clientError.userAgent;

    // Enhanced metadata
    const enhancedMetadata = {
      ...clientError.metadata,
      clientIP,
      referer,
      userAgent,
      reportedAt: new Date().toISOString(),
      source: 'CLIENT_REPORTED',
    };

    // Log the client error
    await errorLogger.log({
      level: clientError.level,
      message: `Client Error: ${clientError.message}`,
      source: 'CLIENT',
      stackTrace: clientError.stack,
      userId: clientError.userId,
      url: clientError.url || referer || undefined,
      userAgent,
      ip: clientIP,
      metadata: enhancedMetadata,
    });

    // Rate limiting check (simple in-memory implementation)
    const rateLimitKey = `client_errors_${clientIP}_${clientError.userId || 'anonymous'}`;
    if (await isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Rate limit exceeded for error reporting' 
        },
        { status: 429 }
      );
    }

    // If this is a critical error, send alert
    if (clientError.level === 'ERROR' && shouldAlertOnError(clientError.message)) {
      await sendErrorAlert(clientError, enhancedMetadata);
    }

    return NextResponse.json({
      success: true,
      message: 'Error logged successfully',
      errorId: clientError.errorId || generateErrorId(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid error report format', error.errors);
    }
    throw error;
  }
});

// Batch error logging endpoint
export const PUT = apiHandler(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { errors } = z.object({
      errors: z.array(ClientErrorSchema).max(10, 'Too many errors in batch'),
    }).parse(body);

    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer');

    // Process each error
    const results = await Promise.allSettled(
      errors.map(async (clientError) => {
        const enhancedMetadata = {
          ...clientError.metadata,
          clientIP,
          referer,
          userAgent: userAgent || clientError.userAgent,
          reportedAt: new Date().toISOString(),
          source: 'CLIENT_BATCH',
        };

        await errorLogger.log({
          level: clientError.level,
          message: `Batch Client Error: ${clientError.message}`,
          source: 'CLIENT',
          stackTrace: clientError.stack,
          userId: clientError.userId,
          url: clientError.url || referer || undefined,
          userAgent: userAgent || clientError.userAgent,
          ip: clientIP,
          metadata: enhancedMetadata,
        });

        return { success: true, errorId: clientError.errorId || generateErrorId() };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Batch processed: ${successful} successful, ${failed} failed`,
      results: results.map(r => 
        r.status === 'fulfilled' 
          ? r.value 
          : { success: false, error: 'Processing failed' }
      ),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid batch error format', error.errors);
    }
    throw error;
  }
});

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

async function isRateLimited(key: string): Promise<boolean> {
  const now = Date.now();
  const limit = 10; // 10 errors per minute
  const window = 60000; // 1 minute

  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + window });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count++;
  return false;
}

function shouldAlertOnError(message: string): boolean {
  const criticalPatterns = [
    /security/i,
    /unauthorized/i,
    /sql injection/i,
    /xss/i,
    /csrf/i,
    /payment/i,
    /authentication/i,
  ];

  return criticalPatterns.some(pattern => pattern.test(message));
}

async function sendErrorAlert(
  error: z.infer<typeof ClientErrorSchema>,
  metadata: Record<string, any>
): Promise<void> {
  try {
    // In a real implementation, this would send to Slack, email, or monitoring service
    console.error('CRITICAL CLIENT ERROR ALERT:', {
      message: error.message,
      url: error.url,
      userId: error.userId,
      timestamp: new Date().toISOString(),
      metadata,
    });

    // Example: Send to webhook
    if (process.env.ERROR_WEBHOOK_URL) {
      await fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Client Error: ${error.message}`,
          url: error.url,
          userId: error.userId,
          metadata,
        }),
      }).catch(console.error);
    }
  } catch (alertError) {
    console.error('Failed to send error alert:', alertError);
  }
}

function generateErrorId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Statistics endpoint for error monitoring
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get('hours') || '24');
  const source = searchParams.get('source') || 'CLIENT';

  try {
    const metrics = await errorLogger.getErrorMetrics(
      new Date(Date.now() - hours * 60 * 60 * 1000),
      new Date()
    );

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        timeRange: `${hours} hours`,
        source,
      },
    });
  } catch (error) {
    throw new Error('Failed to retrieve error statistics');
  }
});