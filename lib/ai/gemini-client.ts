import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment variable
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('GOOGLE_GEMINI_API_KEY not found in environment variables');
}
const genAI = new GoogleGenerativeAI(apiKey);

export interface ObservationAnalysisResult {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  detailedFeedback: string;
  performanceLevel: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
}

export async function analyzeObservation(observationData: any): Promise<ObservationAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare the observation data for analysis
    const prompt = `
    You are an educational expert analyzing a classroom observation. Please analyze the following teaching observation data and provide feedback in JSON format.

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

    Evaluation Results:
    ${JSON.stringify(observationData.evaluationData || {}, null, 2)}

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
  const evaluationValues = Object.values(observationData.evaluationData || {});
  const yesCount = evaluationValues.filter((v: any) => v === 'yes').length;
  const totalCount = evaluationValues.length || 1;
  const score = Math.round((yesCount / totalCount) * 10);

  return {
    overallScore: score || 7,
    strengths: [
      'Teacher demonstrates professional commitment',
      'Lesson objectives are clearly defined',
      'Good classroom organization'
    ],
    areasForImprovement: [
      'Increase student participation opportunities',
      'Incorporate more varied teaching methods'
    ],
    recommendations: [
      'Consider using group activities to enhance student engagement',
      'Implement regular formative assessments during lessons',
      'Use visual aids to support different learning styles'
    ],
    detailedFeedback: `The observation shows ${score >= 7 ? 'good' : 'satisfactory'} teaching performance. The teacher demonstrates competence in classroom management and content delivery. Focus on increasing student engagement and incorporating diverse teaching strategies for enhanced learning outcomes.`,
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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    As an educational expert, provide 5 specific, actionable recommendations for a ${subject} teacher in grade ${grade}.
    
    Teacher: ${teacherName}
    Areas needing improvement: ${weakAreas.join(', ')}
    
    Please provide 5 practical recommendations that can be implemented immediately in the classroom.
    Format each recommendation as a complete sentence starting with an action verb.
    
    Respond with a JSON array of strings:
    ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [
      'Implement daily warm-up activities to engage students from the start',
      'Use exit tickets to assess student understanding at the end of each lesson',
      'Create visual anchor charts for key concepts',
      'Establish clear routines for transitions between activities',
      'Incorporate peer learning opportunities through structured pair work'
    ];
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      'Focus on clear learning objectives for each lesson',
      'Increase wait time after asking questions',
      'Use positive reinforcement consistently',
      'Implement differentiated instruction strategies',
      'Create a supportive classroom environment'
    ];
  }
}