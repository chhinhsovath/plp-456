import { makeAIRequest, ObservationSuggestion, ObservationAnalysis, TeacherRecommendation } from './zai-client';

// Generate intelligent suggestions for observation form
export async function generateObservationSuggestions(params: {
  subject: string;
  grade: number;
  chapter?: string;
  lesson?: string;
  language?: 'en' | 'km';
}): Promise<ObservationSuggestion> {
  const prompt = `
Based on the following teaching context:
- Subject: ${params.subject}
- Grade: ${params.grade}
- Chapter: ${params.chapter || 'Not specified'}
- Lesson: ${params.lesson || 'Not specified'}

Please provide suggestions for:
1. A suitable lesson title
2. 3-5 specific lesson objectives
3. Appropriate teaching methods for this grade level
4. Evaluation criteria aligned with the objectives
5. Expected learning outcomes

Format the response as JSON with the following structure:
{
  "lessonTitle": "string",
  "lessonObjectives": ["string", ...],
  "teachingMethods": ["string", ...],
  "evaluationCriteria": ["string", ...],
  "expectedOutcomes": ["string", ...]
}

Consider age-appropriate pedagogy and best practices for ${params.grade}th grade students.
${params.language === 'km' ? 'Provide bilingual suggestions with Khmer translations where appropriate.' : ''}
`;

  const response = await makeAIRequest([
    {
      role: 'system',
      content: 'You are an expert educational consultant specializing in K-12 curriculum design and teacher observation. Provide practical, evidence-based suggestions.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.8,
    thinking: true,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return {
      lessonTitle: '',
      lessonObjectives: [],
      teachingMethods: [],
      evaluationCriteria: [],
      expectedOutcomes: [],
    };
  }
}

// Analyze completed observation data
export async function analyzeObservation(observationData: any): Promise<ObservationAnalysis> {
  const prompt = `
Analyze this teacher observation data and provide comprehensive feedback:

${JSON.stringify(observationData, null, 2)}

Please analyze:
1. Teaching strengths demonstrated
2. Areas that need improvement
3. Specific recommendations for professional growth
4. Overall performance score (1-10)
5. Detailed feedback paragraph

Consider:
- Student engagement levels
- Teaching methodology effectiveness
- Classroom management
- Learning objectives achievement
- Use of teaching resources

Format as JSON:
{
  "strengths": ["string", ...],
  "areasForImprovement": ["string", ...],
  "recommendations": ["string", ...],
  "overallScore": number,
  "detailedFeedback": "string"
}
`;

  const response = await makeAIRequest([
    {
      role: 'system',
      content: 'You are an experienced educational evaluator. Provide constructive, specific, and actionable feedback based on observation data.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.7,
    thinking: true,
    maxTokens: 6000,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse analysis:', error);
    throw new Error('Failed to analyze observation data');
  }
}

// Generate teacher improvement recommendations
export async function generateTeacherRecommendations(
  teacherHistory: any[],
  latestObservation: any
): Promise<TeacherRecommendation> {
  const prompt = `
Based on the teacher's observation history and latest observation, provide personalized professional development recommendations:

Latest Observation:
${JSON.stringify(latestObservation, null, 2)}

Historical Performance Summary:
${JSON.stringify(teacherHistory, null, 2)}

Generate:
1. Professional development courses/workshops (3-5 specific recommendations)
2. Teaching resources and materials
3. Specific strategies to implement
4. A realistic timeline for improvement

Format as JSON:
{
  "professionalDevelopment": ["string", ...],
  "resources": ["string", ...],
  "strategies": ["string", ...],
  "timeline": "string"
}
`;

  const response = await makeAIRequest([
    {
      role: 'system',
      content: 'You are a teacher development specialist. Provide specific, actionable recommendations based on observed patterns and needs.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.8,
    thinking: true,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

// Validate and enhance observation data
export async function validateObservationData(data: any): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: Record<string, string>;
}> {
  const prompt = `
Validate this teacher observation form data for completeness and consistency:

${JSON.stringify(data, null, 2)}

Check for:
1. Missing critical fields
2. Logical inconsistencies
3. Unusual patterns
4. Data quality issues

Provide:
1. Validation status (true/false)
2. List of issues found
3. Suggestions for missing or problematic fields

Format as JSON:
{
  "isValid": boolean,
  "issues": ["string", ...],
  "suggestions": {
    "fieldName": "suggested value or correction",
    ...
  }
}
`;

  const response = await makeAIRequest([
    {
      role: 'system',
      content: 'You are a data quality specialist for educational systems. Identify issues and provide helpful suggestions.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.5,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse validation:', error);
    return {
      isValid: true,
      issues: [],
      suggestions: {},
    };
  }
}