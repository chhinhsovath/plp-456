import { NextRequest, NextResponse } from 'next/server';

export interface CorsOptions {
  origin?: string | string[] | ((origin: string | undefined) => boolean | string | Promise<boolean | string>);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

const defaultOptions: CorsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export async function cors(
  req: NextRequest,
  res: NextResponse,
  options: CorsOptions = {}
): Promise<NextResponse> {
  const opts = { ...defaultOptions, ...options };
  const origin = req.headers.get('origin');
  const isPreflight = req.method === 'OPTIONS';

  // Handle origin
  let allowOrigin: string | false = false;
  
  if (!opts.origin || opts.origin === '*') {
    allowOrigin = '*';
  } else if (typeof opts.origin === 'string') {
    allowOrigin = opts.origin;
  } else if (Array.isArray(opts.origin)) {
    if (origin && opts.origin.includes(origin)) {
      allowOrigin = origin;
    }
  } else if (typeof opts.origin === 'function') {
    const result = await opts.origin(origin || undefined);
    if (result === true && origin) {
      allowOrigin = origin;
    } else if (typeof result === 'string') {
      allowOrigin = result;
    }
  }

  // Set CORS headers
  if (allowOrigin) {
    res.headers.set('Access-Control-Allow-Origin', allowOrigin);
    
    if (opts.credentials && allowOrigin !== '*') {
      res.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Handle preflight requests
  if (isPreflight) {
    // Set allowed methods
    if (opts.methods && opts.methods.length > 0) {
      res.headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
    }

    // Set allowed headers
    const requestHeaders = req.headers.get('access-control-request-headers');
    if (opts.allowedHeaders) {
      res.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '));
    } else if (requestHeaders) {
      res.headers.set('Access-Control-Allow-Headers', requestHeaders);
    }

    // Set max age
    if (opts.maxAge) {
      res.headers.set('Access-Control-Max-Age', String(opts.maxAge));
    }

    // Return early for preflight unless preflightContinue is true
    if (!opts.preflightContinue) {
      return new NextResponse(null, { 
        status: opts.optionsSuccessStatus,
        headers: res.headers 
      });
    }
  }

  // Set exposed headers for actual requests
  if (opts.exposedHeaders && opts.exposedHeaders.length > 0) {
    res.headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '));
  }

  // Add Vary header to indicate that response varies based on Origin
  const vary = res.headers.get('Vary');
  if (!vary) {
    res.headers.set('Vary', 'Origin');
  } else if (!vary.includes('Origin')) {
    res.headers.set('Vary', `${vary}, Origin`);
  }

  return res;
}

// CORS middleware for API routes
export function corsMiddleware(options: CorsOptions = {}) {
  return async function middleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      return cors(req, response, options);
    }

    // Handle actual requests
    const response = await next();
    return cors(req, response, options);
  };
}

// Predefined CORS configurations

// Development CORS (permissive)
export const developmentCors: CorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
};

// Production CORS (restrictive)
export const productionCors: CorsOptions = {
  origin: (origin) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const allowedPatterns = [
      /^https:\/\/.*\.plp-456\.gov\.kh$/,
      /^https:\/\/plp-456\.gov\.kh$/,
    ];

    if (!origin) return false;
    
    if (allowedOrigins.includes(origin)) return true;
    
    return allowedPatterns.some(pattern => pattern.test(origin));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
};

// API-specific CORS
export const apiCors: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' ? productionCors.origin : developmentCors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-User-ID',
    'X-Session-ID',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
};

// File upload CORS
export const uploadCors: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' ? productionCors.origin : developmentCors.origin,
  credentials: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-File-Name',
    'X-File-Size',
    'X-File-Type',
  ],
  exposedHeaders: ['X-Upload-ID', 'X-File-URL'],
  maxAge: 3600, // 1 hour
};

// WebSocket CORS
export const websocketCors: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' ? productionCors.origin : true,
  credentials: true,
  methods: ['GET'],
  allowedHeaders: ['Upgrade', 'Connection', 'Sec-WebSocket-Key', 'Sec-WebSocket-Version'],
};

// Helper function to validate origin
export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  
  // Check exact match
  if (allowedOrigins.includes(origin)) return true;
  
  // Check wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) return true;
    }
  }
  
  return false;
}

// Dynamic CORS based on user role
export function createRoleBasedCors(getRoleFromRequest: (req: NextRequest) => Promise<string | null>) {
  return async function roleBasedCors(origin: string | undefined): Promise<boolean> {
    if (!origin) return false;

    // Always allow same-origin
    if (origin === process.env.NEXT_PUBLIC_APP_URL) return true;

    // Check if origin is in allowed list
    const publicOrigins = ['https://public.plp-456.gov.kh'];
    if (publicOrigins.includes(origin)) return true;

    // For other origins, check user role
    // This would need access to the request object, which is not available in the origin function
    // In practice, you might handle this differently
    return false;
  };
}

// CORS configuration for specific routes
export const corsConfigs = {
  '/api/auth': {
    origin: productionCors.origin,
    credentials: true,
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
  },
  '/api/public': {
    origin: '*',
    methods: ['GET'],
    credentials: false,
  },
  '/api/admin': {
    origin: (origin) => {
      const adminOrigins = process.env.ADMIN_ORIGINS?.split(',') || [];
      return origin ? adminOrigins.includes(origin) : false;
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
};