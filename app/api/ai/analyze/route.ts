import { NextRequest, NextResponse } from 'next/server';
import { analyzeObservation } from '@/lib/ai/gemini-client';

// Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 10; // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or user agent as fallback for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function validateRequestData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { observationData, language } = data;
  
  if (!observationData || typeof observationData !== 'object') {
    return { valid: false, error: 'Observation data is required and must be an object' };
  }
  
  if (language && !['km', 'en'].includes(language)) {
    return { valid: false, error: 'Language must be either "km" or "en"' };
  }
  
  // Check for required fields in observationData
  const requiredFields = ['nameOfTeacher', 'subject', 'school'];
  for (const field of requiredFields) {
    if (!observationData[field] || typeof observationData[field] !== 'string' || !observationData[field].trim()) {
      return { valid: false, error: `${field} is required and must be a non-empty string` };
    }
  }
  
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request data
    const validation = validateRequestData(requestData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { observationData, language = 'km' } = requestData;

    // Analyze observation with error handling
    const analysis = await analyzeObservation(observationData, language);
    
    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error in AI analysis API:', error);
    
    // Handle different types of errors appropriately
    if (error instanceof Error) {
      if (error.message.includes('configuration error')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please contact support.' },
          { status: 503 }
        );
      }
      if (error.message.includes('temporarily unavailable')) {
        return NextResponse.json(
          { error: 'AI service is temporarily unavailable. Please try again later.' },
          { status: 503, headers: { 'Retry-After': '300' } }
        );
      }
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: 'Invalid data provided for analysis' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred during analysis' },
      { status: 500 }
    );
  }
}