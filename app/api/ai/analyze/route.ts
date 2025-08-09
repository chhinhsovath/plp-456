import { NextRequest, NextResponse } from 'next/server';
import { analyzeObservation } from '@/lib/ai/gemini-client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

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
    // Get session for authentication
    const session = await getServerSession();
    
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
    const inspectionSessionId = observationData.id;
    const grade = observationData.grade;
    
    // Check if we have cached analysis for this observation
    if (inspectionSessionId) {
      try {
        const cachedAnalysis = await prisma.aiAnalysisResult.findUnique({
          where: {
            inspectionSessionId_analysisType: {
              inspectionSessionId: inspectionSessionId,
              analysisType: 'general'
            }
          }
        });
        
        if (cachedAnalysis) {
          // Return cached analysis
          console.log('Returning cached AI analysis for observation:', inspectionSessionId);
          return NextResponse.json({
            overallScore: cachedAnalysis.overallScore,
            performanceLevel: cachedAnalysis.performanceLevel,
            strengths: cachedAnalysis.strengths,
            areasForImprovement: cachedAnalysis.areasForImprovement,
            recommendations: cachedAnalysis.recommendations,
            detailedFeedback: cachedAnalysis.detailedFeedback,
            cached: true,
            cachedAt: cachedAnalysis.createdAt
          }, {
            headers: {
              'Cache-Control': 'private, max-age=3600',
              'Content-Type': 'application/json',
            }
          });
        }
      } catch (cacheError) {
        console.error('Error checking cached analysis:', cacheError);
        // Continue with new analysis if cache check fails
      }
    }

    // Fetch the correct master fields based on grade
    let enrichedObservationData = { ...observationData };
    
    // For grades 1-3, fetch from master_fields_123
    if (grade && ['1', '2', '3'].includes(grade.toString())) {
      try {
        // Use raw query to fetch from master_fields_123
        const masterFields123 = await prisma.$queryRaw`
          SELECT id, indicator, grade, level 
          FROM master_fields_123 
          WHERE grade = ${`G${grade}`}
          ORDER BY id
        `;
        
        // Transform to match expected format
        enrichedObservationData.masterFields = (masterFields123 as any[]).map(field => ({
          id: field.id,
          indicator: field.indicator,
          indicator_sub: field.indicator, // Use same value for compatibility
          level: field.level
        }));
        
        console.log(`Fetched ${enrichedObservationData.masterFields.length} fields from master_fields_123 for grade ${grade}`);
      } catch (fetchError) {
        console.error('Error fetching master_fields_123:', fetchError);
      }
    } 
    // For grades 4-6, use the existing master_fields
    else if (grade && ['4', '5', '6'].includes(grade.toString())) {
      try {
        const masterFields = await prisma.masterField.findMany({
          where: { isActive: true },
          orderBy: { indicatorSequence: 'asc' }
        });
        
        enrichedObservationData.masterFields = masterFields.map(field => ({
          id: field.fieldId,
          indicator: field.indicatorSub,
          indicator_sub: field.indicatorSub,
          level: field.evaluationLevel
        }));
        
        console.log(`Fetched ${enrichedObservationData.masterFields.length} fields from master_fields for grade ${grade}`);
      } catch (fetchError) {
        console.error('Error fetching master_fields:', fetchError);
      }
    }
    
    // Analyze observation with error handling
    const analysis = await analyzeObservation(enrichedObservationData, language);
    
    // Save analysis results if we have an inspection session ID
    if (inspectionSessionId && analysis) {
      try {
        await prisma.aiAnalysisResult.upsert({
          where: {
            inspectionSessionId_analysisType: {
              inspectionSessionId: inspectionSessionId,
              analysisType: 'general'
            }
          },
          update: {
            overallScore: analysis.overallScore,
            performanceLevel: analysis.performanceLevel,
            strengths: analysis.strengths,
            areasForImprovement: analysis.areasForImprovement,
            recommendations: analysis.recommendations,
            detailedFeedback: analysis.detailedFeedback,
            language: language,
            metadata: {
              teacherName: observationData.nameOfTeacher,
              subject: observationData.subject,
              school: observationData.school,
              grade: observationData.grade,
              analysisDate: new Date().toISOString()
            },
            updatedAt: new Date(),
            createdBy: session?.email || 'system'
          },
          create: {
            inspectionSessionId: inspectionSessionId,
            analysisType: 'general',
            overallScore: analysis.overallScore,
            performanceLevel: analysis.performanceLevel,
            strengths: analysis.strengths,
            areasForImprovement: analysis.areasForImprovement,
            recommendations: analysis.recommendations,
            detailedFeedback: analysis.detailedFeedback,
            language: language,
            metadata: {
              teacherName: observationData.nameOfTeacher,
              subject: observationData.subject,
              school: observationData.school,
              grade: observationData.grade,
              analysisDate: new Date().toISOString()
            },
            createdBy: session?.email || 'system'
          }
        });
        console.log('AI analysis saved for observation:', inspectionSessionId);
      } catch (saveError) {
        console.error('Error saving AI analysis:', saveError);
        // Continue returning the analysis even if save fails
      }
    }
    
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