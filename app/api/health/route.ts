import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    external: {
      [serviceName: string]: ServiceHealth;
    };
  };
  metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    responseTime: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastChecked: string;
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: (error as Error).message,
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkExternalServices(): Promise<Record<string, ServiceHealth>> {
  const services: Record<string, ServiceHealth> = {};
  
  // Check AI service (if configured)
  if (process.env.OPENAI_API_KEY) {
    const start = Date.now();
    try {
      // Simple ping to OpenAI API
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      
      const responseTime = Date.now() - start;
      services.openai = {
        status: response.ok ? (responseTime > 2000 ? 'degraded' : 'healthy') : 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        ...((!response.ok) && { error: `HTTP ${response.status}` }),
      };
    } catch (error) {
      services.openai = {
        status: 'unhealthy',
        error: (error as Error).message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // Check email service (if configured)
  if (process.env.SMTP_HOST) {
    // For SMTP, we'll just mark as healthy if configured
    // In a real implementation, you might test SMTP connectivity
    services.email = {
      status: 'healthy',
      lastChecked: new Date().toISOString(),
    };
  }

  return services;
}

async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  // Run health checks in parallel
  const [databaseHealth, externalServices] = await Promise.all([
    checkDatabaseHealth(),
    checkExternalServices(),
  ]);

  const responseTime = Date.now() - startTime;
  
  // Determine overall status
  const allServices = [databaseHealth, ...Object.values(externalServices)];
  const hasUnhealthy = allServices.some(service => service.status === 'unhealthy');
  const hasDegraded = allServices.some(service => service.status === 'degraded');
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: databaseHealth,
      external: externalServices,
    },
    metrics: {
      memoryUsage: process.memoryUsage(),
      responseTime,
    },
  };
}

async function handleHealthCheck(req: NextRequest): Promise<NextResponse> {
  const healthCheck = await performHealthCheck();
  
  // Set appropriate HTTP status code based on health
  let statusCode = 200;
  if (healthCheck.status === 'degraded') {
    statusCode = 200; // Still OK, but degraded
  } else if (healthCheck.status === 'unhealthy') {
    statusCode = 503; // Service Unavailable
  }

  return NextResponse.json(healthCheck, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// Lightweight ping endpoint for frequent checks
async function handlePing(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'ping') {
    return handlePing(req);
  }

  return handleHealthCheck(req);
});

// Readiness probe endpoint
export async function handleReadiness(req: NextRequest): Promise<NextResponse> {
  try {
    // Check if the application is ready to serve requests
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { status: 'ready', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not_ready',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Liveness probe endpoint
export async function handleLiveness(req: NextRequest): Promise<NextResponse> {
  // Simple liveness check - just return OK if the process is running
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
    },
    { status: 200 }
  );
}