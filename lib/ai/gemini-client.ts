import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment variable
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('GOOGLE_GEMINI_API_KEY not found in environment variables');
  throw new Error('Missing required environment variable: GOOGLE_GEMINI_API_KEY');
}

// Validate API key format (basic check)
if (typeof apiKey !== 'string' || apiKey.length < 10) {
  throw new Error('Invalid GOOGLE_GEMINI_API_KEY format');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Input validation helper
function validateObservationData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  return true; // Basic validation - can be extended
}

// Sanitize string input to prevent injection
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>"'&]/g, '').slice(0, 1000); // Basic sanitization
}

// Helper function to process evaluation data with indicator descriptions
function processEvaluationWithIndicators(observationData: any): string {
  if (!validateObservationData(observationData)) {
    return 'Invalid observation data provided';
  }
  const evaluationData = observationData.evaluationData || {};
  const evaluationRecords = observationData.evaluationRecords || [];
  const masterFields = observationData.masterFields || [];
  const grade = observationData.grade || '';
  
  // Determine which indicator field to use based on grade
  // Grade 1-2-3 uses 'indicator' field from master_fields_123
  // Grade 4-5-6 uses 'indicator_sub' field from master_fields
  const isGrade123 = ['1', '2', '3'].includes(grade.toString());
  
  // Create a map of indicator sequences to field info
  const fieldMap: { [key: number]: any } = {};
  
  // If we have evaluation records with field info, use those
  if (evaluationRecords && evaluationRecords.length > 0) {
    evaluationRecords.forEach((record: any) => {
      if (record.field) {
        const sequence = record.field.indicatorSequence || record.field.fieldId;
        fieldMap[sequence] = {
          indicator: isGrade123 
            ? (record.field.indicatorMain || record.field.indicatorSub)
            : record.field.indicatorSub,
          value: record.scoreValue
        };
      }
    });
  }
  
  // Otherwise use the masterFields array if provided
  if (Object.keys(fieldMap).length === 0 && masterFields.length > 0) {
    masterFields.forEach((field: any, index: number) => {
      const sequence = field.indicatorSequence || field.id || (index + 1);
      fieldMap[sequence] = {
        indicator: field.indicator || field.indicator_sub,
        value: null
      };
    });
  }
  
  // Build a formatted string with indicators and their values
  const evaluationLines: string[] = [];
  
  // Process based on what data we have
  if (Object.keys(fieldMap).length > 0) {
    // Use the field map
    Object.entries(evaluationData).forEach(([fieldKey, value]) => {
      if (fieldKey.startsWith('indicator_') && !fieldKey.includes('_comment')) {
        const sequence = parseInt(fieldKey.replace('indicator_', ''));
        const field = fieldMap[sequence];
        if (field) {
          evaluationLines.push(`- ${field.indicator}: ${value}`);
        } else {
          evaluationLines.push(`- Indicator ${sequence}: ${value}`);
        }
      }
    });
  } else {
    // Fallback to raw data
    Object.entries(evaluationData).forEach(([fieldKey, value]) => {
      if (fieldKey.startsWith('indicator_') && !fieldKey.includes('_comment')) {
        evaluationLines.push(`- ${fieldKey}: ${value}`);
      }
    });
  }
  
  return evaluationLines.length > 0 
    ? evaluationLines.join('\n')
    : 'No evaluation data available';
}

export interface ObservationAnalysisResult {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  detailedFeedback: string;
  performanceLevel: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
}

export async function analyzeObservation(
  observationData: any, 
  language: 'km' | 'en' = 'km'
): Promise<ObservationAnalysisResult> {
  // Input validation
  if (!validateObservationData(observationData)) {
    throw new Error('Invalid observation data provided');
  }
  
  if (!['km', 'en'].includes(language)) {
    throw new Error('Invalid language parameter. Must be "km" or "en"');
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.1, // Lower temperature for more consistent results
      },
    });

    const languageInstruction = language === 'km' 
      ? 'IMPORTANT: Provide ALL text responses in Khmer language (ភាសាខ្មែរ). All strengths, improvements, recommendations, and feedback MUST be written in Khmer.'
      : 'Provide all responses in English.';

    // Process evaluation data to include indicator descriptions
    const processedEvaluationData = processEvaluationWithIndicators(observationData);

    // Sanitize input data
    const sanitizedData = {
      nameOfTeacher: sanitizeString(observationData.nameOfTeacher || 'Unknown'),
      subject: sanitizeString(observationData.subject || 'Unknown'),
      grade: sanitizeString(String(observationData.grade || 'Unknown')),
      school: sanitizeString(observationData.school || 'Unknown'),
      sessionTime: sanitizeString(observationData.sessionTime || 'Unknown'),
      chapter: sanitizeString(observationData.chapter || 'N/A'),
      lesson: sanitizeString(observationData.lesson || 'N/A'),
      generalNotes: sanitizeString(observationData.generalNotes || 'None provided')
    };
    
    // Validate numerical data
    const totalMale = Math.max(0, parseInt(observationData.totalMale) || 0);
    const totalFemale = Math.max(0, parseInt(observationData.totalFemale) || 0);
    const totalAbsent = Math.max(0, parseInt(observationData.totalAbsent) || 0);
    const totalStudents = totalMale + totalFemale;
    const presentStudents = Math.max(0, totalStudents - totalAbsent);

    // Prepare the observation data for analysis
    const prompt = `You are an educational expert analyzing a classroom observation. Please analyze the following teaching observation data and provide feedback in JSON format.
    
    ${languageInstruction}

    Observation Data:
    - Teacher: ${sanitizedData.nameOfTeacher}
    - Subject: ${sanitizedData.subject}
    - Grade: ${sanitizedData.grade}
    - School: ${sanitizedData.school}
    - Date: ${observationData.inspectionDate || new Date().toISOString().split('T')[0]}
    - Total Students: ${totalStudents}
    - Present Students: ${presentStudents}
    - Session Time: ${sanitizedData.sessionTime}
    - Chapter/Lesson: ${sanitizedData.chapter} / ${sanitizedData.lesson}

    Evaluation Results with Indicators:
    ${processedEvaluationData}

    General Notes: ${sanitizedData.generalNotes}

    Based on this data, provide a comprehensive analysis with:
    1. An overall performance score (0-10)
    2. Key teaching strengths observed (3-5 points)
    3. Areas that need improvement (2-4 points)
    4. Specific recommendations for improvement (3-5 actionable items)
    5. Detailed feedback paragraph
    6. Performance level: excellent (9-10), good (7-8), satisfactory (5-6), or needs_improvement (below 5)

    Please respond ONLY with a valid JSON object in this exact format:
    {
      "overallScore": 0,
      "strengths": ["strength1", "strength2"],
      "areasForImprovement": ["area1", "area2"],
      "recommendations": ["recommendation1", "recommendation2"],
      "detailedFeedback": "paragraph of feedback",
      "performanceLevel": "good"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI service');
    }
    
    // Extract JSON from the response with better error handling
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Validate the response structure
        const validatedAnalysis = {
          overallScore: typeof analysis.overallScore === 'number' && 
                       analysis.overallScore >= 0 && 
                       analysis.overallScore <= 10 
                       ? analysis.overallScore : 7,
          strengths: Array.isArray(analysis.strengths) && analysis.strengths.length > 0 
                    ? analysis.strengths.slice(0, 5).map((s: any) => sanitizeString(String(s)))
                    : ['Good classroom presence', 'Clear communication'],
          areasForImprovement: Array.isArray(analysis.areasForImprovement) && analysis.areasForImprovement.length > 0
                              ? analysis.areasForImprovement.slice(0, 4).map((a: any) => sanitizeString(String(a)))
                              : ['Time management', 'Student engagement'],
          recommendations: Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0
                          ? analysis.recommendations.slice(0, 5).map((r: any) => sanitizeString(String(r)))
                          : ['Use more interactive activities', 'Implement formative assessments'],
          detailedFeedback: typeof analysis.detailedFeedback === 'string'
                           ? sanitizeString(analysis.detailedFeedback)
                           : 'The observation shows satisfactory teaching performance with room for improvement.',
          performanceLevel: ['excellent', 'good', 'satisfactory', 'needs_improvement'].includes(analysis.performanceLevel)
                           ? analysis.performanceLevel
                           : 'good'
        };
        
        return validatedAnalysis;
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Invalid JSON response from AI service');
      }
    }

    throw new Error('No valid JSON found in AI response');
  } catch (error) {
    console.error('Error analyzing observation with Gemini:', error);
    
    // Different error handling based on error type
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new Error('AI service temporarily unavailable. Please try again later.');
      }
    }
    
    // Return fallback analysis for other errors
    console.log('Falling back to basic analysis due to:', error);
    return generateFallbackAnalysis(observationData);
  }
}

function generateFallbackAnalysis(observationData: any): ObservationAnalysisResult {
  // Calculate a basic score based on evaluation data
  const evaluationData = observationData.evaluationData || {};
  const evaluationRecords = observationData.evaluationRecords || [];
  const masterFields = observationData.masterFields || [];
  const grade = observationData.grade || '';
  
  // Count yes/no/some_practice values from evaluation data
  let yesCount = 0;
  let noCount = 0;
  let someCount = 0;
  let totalCount = 0;
  
  Object.entries(evaluationData).forEach(([key, value]) => {
    if (key.startsWith('indicator_') && !key.includes('_comment')) {
      totalCount++;
      if (value === 'yes') yesCount++;
      else if (value === 'no') noCount++;
      else if (value === 'some_practice') someCount++;
    }
  });
  
  const score = totalCount > 0 ? Math.round(((yesCount + someCount * 0.5) / totalCount) * 10) : 5;

  // Determine which indicator field to use based on grade
  const isGrade123 = ['1', '2', '3'].includes(grade.toString());

  // Create field map for looking up indicators
  const fieldMap: { [key: number]: any } = {};
  
  if (evaluationRecords && evaluationRecords.length > 0) {
    evaluationRecords.forEach((record: any) => {
      if (record.field) {
        const sequence = record.field.indicatorSequence || record.field.fieldId;
        fieldMap[sequence] = record.field;
      }
    });
  } else if (masterFields.length > 0) {
    masterFields.forEach((field: any) => {
      const sequence = field.indicatorSequence || field.id;
      fieldMap[sequence] = field;
    });
  }

  // Find strengths (yes answers) and areas for improvement (no answers)
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  
  Object.entries(evaluationData).forEach(([fieldKey, value]) => {
    const field = (fieldMap as any)[fieldKey];
    if (field) {
      // Use correct indicator field based on grade level
      const indicator = isGrade123 
        ? (field.indicator || field.indicator_sub)
        : (field.indicator_sub || field.indicator);
      
      if (indicator) {
        if (value === 'yes' && strengths.length < 3) {
          strengths.push(`✓ ${indicator}`);
        } else if (value === 'no' && areasForImprovement.length < 3) {
          areasForImprovement.push(`• ${indicator}`);
        }
      }
    }
  });

  // Add default strengths if none found
  if (strengths.length === 0) {
    strengths.push(
      'គ្រូបង្ហាញការប្តេជ្ញាចិត្តប្រកបដោយវិជ្ជាជីវៈ',
      'គោលបំណងមេរៀនត្រូវបានកំណត់យ៉ាងច្បាស់លាស់',
      'ការរៀបចំថ្នាក់រៀនល្អ'
    );
  }

  // Add default areas for improvement if none found
  if (areasForImprovement.length === 0) {
    areasForImprovement.push(
      'បង្កើនឱកាសចូលរួមរបស់សិស្ស',
      'បញ្ចូលវិធីសាស្ត្របង្រៀនចម្រុះបន្ថែម'
    );
  }

  return {
    overallScore: score || 7,
    strengths,
    areasForImprovement,
    recommendations: [
      'ពិចារណាប្រើសកម្មភាពជាក្រុមដើម្បីបង្កើនការចូលរួមរបស់សិស្ស',
      'អនុវត្តការវាយតម្លៃរៀនសូត្រជាប្រចាំក្នុងអំឡុងពេលមេរៀន',
      'ប្រើឧបករណ៍មើលឃើញដើម្បីគាំទ្ររចនាប័ទ្មសិក្សាផ្សេងៗ'
    ],
    detailedFeedback: `ការសង្កេតបង្ហាញពីការបង្រៀន${score >= 7 ? 'ល្អ' : 'គួរជាទីពេញចិត្ត'}។ គ្រូបង្ហាញសមត្ថភាពក្នុងការគ្រប់គ្រងថ្នាក់រៀន និងការផ្តល់មាតិកា។ សរុប: បាទ/ចាស ${yesCount}, ទេ ${noCount} ពី ${totalCount} លក្ខណៈវិនិច្ឆ័យ។`,
    performanceLevel: score >= 9 ? 'excellent' : score >= 7 ? 'good' : score >= 5 ? 'satisfactory' : 'needs_improvement'
  };
}

export async function generateTeachingRecommendations(
  teacherName: string,
  subject: string,
  grade: string,
  weakAreas: string[]
): Promise<string[]> {
  // Input validation
  if (!teacherName || typeof teacherName !== 'string') {
    throw new Error('Invalid teacher name provided');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('Invalid subject provided');
  }
  if (!grade || typeof grade !== 'string') {
    throw new Error('Invalid grade provided');
  }
  if (!Array.isArray(weakAreas)) {
    throw new Error('Invalid weak areas provided');
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.2,
      },
    });

    // Sanitize inputs
    const sanitizedTeacherName = sanitizeString(teacherName);
    const sanitizedSubject = sanitizeString(subject);
    const sanitizedGrade = sanitizeString(grade);
    const sanitizedWeakAreas = weakAreas
      .filter(area => typeof area === 'string' && area.trim().length > 0)
      .slice(0, 10) // Limit to prevent oversized prompts
      .map(area => sanitizeString(area));

    if (sanitizedWeakAreas.length === 0) {
      return getDefaultRecommendations();
    }

    const prompt = `As an educational expert, provide 5 specific, actionable recommendations for a ${sanitizedSubject} teacher in grade ${sanitizedGrade}.
    
    IMPORTANT: Provide ALL recommendations in Khmer language (ភាសាខ្មែរ).
    
    Teacher: ${sanitizedTeacherName}
    Areas needing improvement: ${sanitizedWeakAreas.join(', ')}
    
    Please provide 5 practical recommendations that can be implemented immediately in the classroom.
    Format each recommendation as a complete sentence in Khmer.
    
    Respond with a JSON array of strings:
    ["អនុសាសន៍ទី១", "អនុសាសន៍ទី២", "អនុសាសន៍ទី៣", "អនុសាសន៍ទី៤", "អនុសាសន៍ទី៥"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim().length === 0) {
      return getDefaultRecommendations();
    }
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const recommendations = JSON.parse(jsonMatch[0]);
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          // Validate and sanitize recommendations
          return recommendations
            .filter((rec: any) => typeof rec === 'string' && rec.trim().length > 0)
            .slice(0, 5)
            .map((rec: string) => sanitizeString(rec));
        }
      } catch (parseError) {
        console.error('JSON parsing error in recommendations:', parseError);
      }
    }

    return getDefaultRecommendations();
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return getDefaultRecommendations();
  }
}

// Helper function for default recommendations
function getDefaultRecommendations(): string[] {
  return [
    'ផ្តោតលើគោលបំណងសិក្សាច្បាស់លាស់សម្រាប់មេរៀននីមួយៗ',
    'បង្កើនពេលវេលារង់ចាំបន្ទាប់ពីសួរសំណួរ',
    'ប្រើការពង្រឹងវិជ្ជមានជាប់លាប់',
    'អនុវត្តយុទ្ធសាស្ត្របង្រៀនដែលមានភាពខុសគ្នា',
    'បង្កើតបរិយាកាសថ្នាក់រៀនដែលគាំទ្រ'
  ];
}