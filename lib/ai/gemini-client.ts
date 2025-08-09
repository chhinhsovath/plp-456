import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment variable
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('GOOGLE_GEMINI_API_KEY not found in environment variables');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to process evaluation data with indicator descriptions
function processEvaluationWithIndicators(observationData: any): string {
  const evaluationData = observationData.evaluationData || {};
  const masterFields = observationData.masterFields || [];
  const grade = observationData.grade || '';
  
  // Determine which indicator field to use based on grade
  // Grade 1-2-3 uses 'indicator' field from master_fields_123
  // Grade 4-5-6 uses 'indicator_sub' field from master_fields
  const isGrade123 = ['1', '2', '3'].includes(grade.toString());
  
  // Create a map of field IDs to indicators
  const fieldMap: { [key: string]: any } = {};
  masterFields.forEach((field: any) => {
    fieldMap[`field_${field.id}`] = field;
  });
  
  // Build a formatted string with indicators and their values
  const evaluationLines: string[] = [];
  Object.entries(evaluationData).forEach(([fieldKey, value]) => {
    const field = fieldMap[fieldKey];
    if (field) {
      // For Grade 1-2-3, use 'indicator' field; for Grade 4-5-6, use 'indicator_sub'
      const indicator = isGrade123 
        ? (field.indicator || field.indicator_sub || fieldKey)
        : (field.indicator_sub || field.indicator || fieldKey);
      evaluationLines.push(`- ${indicator}: ${value}`);
    } else {
      // If no matching field found, just show the raw data
      evaluationLines.push(`- ${fieldKey}: ${value}`);
    }
  });
  
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

export async function analyzeObservation(observationData: any, language: 'km' | 'en' = 'km'): Promise<ObservationAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const languageInstruction = language === 'km' 
      ? 'IMPORTANT: Provide ALL text responses in Khmer language (ភាសាខ្មែរ). All strengths, improvements, recommendations, and feedback MUST be written in Khmer.'
      : 'Provide all responses in English.';

    // Process evaluation data to include indicator descriptions
    const processedEvaluationData = processEvaluationWithIndicators(observationData);

    // Prepare the observation data for analysis
    const prompt = `
    You are an educational expert analyzing a classroom observation. Please analyze the following teaching observation data and provide feedback in JSON format.
    
    ${languageInstruction}

    Observation Data:
    - Teacher: ${observationData.nameOfTeacher || 'Unknown'}
    - Subject: ${observationData.subject || 'Unknown'}
    - Grade: ${observationData.grade || 'Unknown'}
    - School: ${observationData.school || 'Unknown'}
    - Date: ${observationData.inspectionDate || new Date().toISOString()}
    - Total Students: ${(observationData.totalMale || 0) + (observationData.totalFemale || 0)}
    - Present Students: ${((observationData.totalMale || 0) + (observationData.totalFemale || 0)) - (observationData.totalAbsent || 0)}
    - Session Time: ${observationData.sessionTime || 'Unknown'}
    - Chapter/Lesson: ${observationData.chapter || 'N/A'} / ${observationData.lesson || 'N/A'}

    Evaluation Results with Indicators:
    ${processedEvaluationData}

    Student Assessment Scores:
    ${JSON.stringify(observationData.studentAssessment?.scores || {}, null, 2)}

    General Notes: ${observationData.generalNotes || 'None provided'}

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
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        overallScore: analysis.overallScore || 7,
        strengths: analysis.strengths || ['Good classroom presence', 'Clear communication'],
        areasForImprovement: analysis.areasForImprovement || ['Time management', 'Student engagement'],
        recommendations: analysis.recommendations || ['Use more interactive activities', 'Implement formative assessments'],
        detailedFeedback: analysis.detailedFeedback || 'The observation shows satisfactory teaching performance with room for improvement.',
        performanceLevel: analysis.performanceLevel || 'good'
      };
    }

    // Fallback if JSON parsing fails
    return generateFallbackAnalysis(observationData);
  } catch (error) {
    console.error('Error analyzing observation with Gemini:', error);
    return generateFallbackAnalysis(observationData);
  }
}

function generateFallbackAnalysis(observationData: any): ObservationAnalysisResult {
  // Calculate a basic score based on evaluation data
  const evaluationData = observationData.evaluationData || {};
  const masterFields = observationData.masterFields || [];
  const grade = observationData.grade || '';
  const evaluationValues = Object.values(evaluationData);
  const yesCount = evaluationValues.filter((v: any) => v === 'yes').length;
  const noCount = evaluationValues.filter((v: any) => v === 'no').length;
  const totalCount = evaluationValues.length || 1;
  const score = Math.round((yesCount / totalCount) * 10);

  // Determine which indicator field to use based on grade
  const isGrade123 = ['1', '2', '3'].includes(grade.toString());

  // Create field map for looking up indicators
  const fieldMap: { [key: string]: any } = {};
  masterFields.forEach((field: any) => {
    fieldMap[`field_${field.id}`] = field;
  });

  // Find strengths (yes answers) and areas for improvement (no answers)
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  
  Object.entries(evaluationData).forEach(([fieldKey, value]) => {
    const field = fieldMap[fieldKey];
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
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    As an educational expert, provide 5 specific, actionable recommendations for a ${subject} teacher in grade ${grade}.
    
    IMPORTANT: Provide ALL recommendations in Khmer language (ភាសាខ្មែរ).
    
    Teacher: ${teacherName}
    Areas needing improvement: ${weakAreas.join(', ')}
    
    Please provide 5 practical recommendations that can be implemented immediately in the classroom.
    Format each recommendation as a complete sentence in Khmer.
    
    Respond with a JSON array of strings:
    ["អនុសាសន៍ទី១", "អនុសាសន៍ទី២", "អនុសាសន៍ទី៣", "អនុសាសន៍ទី៤", "អនុសាសន៍ទី៥"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [
      'អនុវត្តសកម្មភាពកម្តៅខ្លួនប្រចាំថ្ងៃដើម្បីទាក់ទាញសិស្សតាំងពីដំបូង',
      'ប្រើសំបុត្រចេញដើម្បីវាយតម្លៃការយល់ដឹងរបស់សិស្សនៅចុងបញ្ចប់មេរៀន',
      'បង្កើតតារាងគោលគំនិតសំខាន់ៗដែលមើលឃើញ',
      'បង្កើតទម្លាប់ច្បាស់លាស់សម្រាប់ការផ្លាស់ប្តូររវាងសកម្មភាព',
      'បញ្ចូលឱកាសសិក្សាពីគ្នាទៅវិញទៅមកតាមរយៈការងារជាគូដែលមានរចនាសម្ព័ន្ធ'
    ];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      'ផ្តោតលើគោលបំណងសិក្សាច្បាស់លាស់សម្រាប់មេរៀននីមួយៗ',
      'បង្កើនពេលវេលារង់ចាំបន្ទាប់ពីសួរសំណួរ',
      'ប្រើការពង្រឹងវិជ្ជមានជាប់លាប់',
      'អនុវត្តយុទ្ធសាស្ត្របង្រៀនដែលមានភាពខុសគ្នា',
      'បង្កើតបរិយាកាសថ្នាក់រៀនដែលគាំទ្រ'
    ];
  }
}