import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

interface SuggestionContext {
  type: 'session_planning' | 'feedback_improvement' | 'progress_analysis' | 'challenge_resolution';
  data: any;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const context: SuggestionContext = await request.json();

    let suggestions = [];

    switch (context.type) {
      case 'session_planning':
        suggestions = await generateSessionPlanningSuggestions(context.data);
        break;
      case 'feedback_improvement':
        suggestions = await generateFeedbackSuggestions(context.data);
        break;
      case 'progress_analysis':
        suggestions = await generateProgressAnalysis(context.data);
        break;
      case 'challenge_resolution':
        suggestions = await generateChallengeSolutions(context.data);
        break;
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}

async function generateSessionPlanningSuggestions(data: any) {
  const { relationshipId, previousSessions, focusAreas } = data;

  // Analyze previous sessions
  const sessionTypes = previousSessions.map((s: any) => s.sessionType);
  const sessionTypeCounts = sessionTypes.reduce((acc: any, type: string) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const suggestions = [];

  // Suggest varied session types
  const leastUsedTypes = ['CLASSROOM_OBSERVATION', 'LESSON_PLANNING', 'REFLECTIVE_PRACTICE', 'PEER_LEARNING']
    .filter(type => (sessionTypeCounts[type] || 0) < 2);

  if (leastUsedTypes.length > 0) {
    suggestions.push({
      id: 'vary_session_types',
      priority: 'high',
      titleKh: 'ប្រើប្រាស់ប្រភេទវគ្គផ្សេងៗ',
      titleEn: 'Vary Session Types',
      descriptionKh: `ពិចារណាប្រើប្រាស់ប្រភេទវគ្គ ${getSessionTypeKhmer(leastUsedTypes[0])} សម្រាប់វគ្គបន្ទាប់`,
      descriptionEn: `Consider using ${leastUsedTypes[0]} for the next session`,
      actionItems: [
        'វិភាគតម្រូវការបច្ចុប្បន្នរបស់គ្រូកំពុងរៀន',
        'ជ្រើសរើសប្រភេទវគ្គដែលស័ក្តិសមបំផុត',
        'រៀបចំសម្ភារៈគាំទ្រ',
      ],
    });
  }

  // Suggest focus area alignment
  if (focusAreas && focusAreas.length > 0) {
    suggestions.push({
      id: 'focus_area_alignment',
      priority: 'medium',
      titleKh: 'តម្រឹមតាមផ្នែកផ្តោតសំខាន់',
      titleEn: 'Align with Focus Areas',
      descriptionKh: `ធានាថាវគ្គបន្ទាប់ផ្តោតលើ: ${focusAreas.join(', ')}`,
      descriptionEn: `Ensure next session focuses on: ${focusAreas.join(', ')}`,
      actionItems: [
        'កំណត់គោលដៅជាក់លាក់សម្រាប់ផ្នែកនីមួយៗ',
        'រៀបចំសកម្មភាពដែលពាក់ព័ន្ធ',
        'កំណត់រង្វាស់វឌ្ឍនភាព',
      ],
    });
  }

  // Time-based suggestions
  const lastSession = previousSessions[0];
  if (lastSession) {
    const daysSinceLastSession = Math.floor(
      (Date.now() - new Date(lastSession.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSession > 14) {
      suggestions.push({
        id: 'session_frequency',
        priority: 'high',
        titleKh: 'បង្កើនភាពញឹកញាប់នៃវគ្គ',
        titleEn: 'Increase Session Frequency',
        descriptionKh: 'វគ្គចុងក្រោយគឺជាង ២ សប្តាហ៍មុន។ ពិចារណាកំណត់ពេលវគ្គឱ្យញឹកញាប់ជាងនេះ។',
        descriptionEn: 'Last session was over 2 weeks ago. Consider scheduling more frequent sessions.',
        actionItems: [
          'កំណត់ពេលវគ្គប្រចាំសប្តាហ៍',
          'បង្កើតកាលវិភាគទៀងទាត់',
          'ប្រើប្រាស់វគ្គខ្លីៗប្រសិនបើពេលវេលាមានកំណត់',
        ],
      });
    }
  }

  return suggestions;
}

async function generateFeedbackSuggestions(data: any) {
  const { feedback, sessionType, observations } = data;

  const suggestions = [];

  // Analyze feedback patterns
  const hasStrengths = feedback.some((f: any) => f.feedbackType === 'strength');
  const hasImprovements = feedback.some((f: any) => f.feedbackType === 'area_for_improvement');
  const hasSuggestions = feedback.some((f: any) => f.feedbackType === 'suggestion');

  if (!hasStrengths) {
    suggestions.push({
      id: 'add_strengths',
      priority: 'high',
      titleKh: 'បន្ថែមចំណុចខ្លាំង',
      titleEn: 'Add Strengths',
      descriptionKh: 'រាល់មតិយោបល់គួរតែរួមបញ្ចូលចំណុចខ្លាំងដើម្បីលើកទឹកចិត្ត',
      descriptionEn: 'Every feedback should include strengths to encourage the mentee',
      examples: [
        'ការគ្រប់គ្រងថ្នាក់រៀនប្រកបដោយប្រសិទ្ធភាព',
        'ការចូលរួមសកម្មពីសិស្ស',
        'ការប្រើប្រាស់សម្ភារៈបង្រៀនច្នៃប្រឌិត',
      ],
    });
  }

  if (!hasSuggestions && hasImprovements) {
    suggestions.push({
      id: 'add_actionable_suggestions',
      priority: 'medium',
      titleKh: 'ផ្តល់សំណូមពរជាក់ស្តែង',
      titleEn: 'Provide Actionable Suggestions',
      descriptionKh: 'បន្ថែមសំណូមពរជាក់ស្តែងសម្រាប់ផ្នែកដែលត្រូវកែលម្អ',
      descriptionEn: 'Add specific suggestions for areas that need improvement',
      template: {
        format: 'សម្រាប់ [បញ្ហា], សាកល្បង [ដំណោះស្រាយ] ដោយ [សកម្មភាពជាក់លាក់]',
        example: 'សម្រាប់ការគ្រប់គ្រងពេលវេលា, សាកល្បងប្រើនាឡិកាកំណត់ម៉ោង ដោយបែងចែកមេរៀនជា ៣ ផ្នែក',
      },
    });
  }

  // Session-specific suggestions
  if (sessionType === 'CLASSROOM_OBSERVATION' && observations.length > 0) {
    suggestions.push({
      id: 'observation_followup',
      priority: 'medium',
      titleKh: 'តាមដានការសង្កេត',
      titleEn: 'Follow Up on Observations',
      descriptionKh: 'ភ្ជាប់មតិយោបល់ទៅនឹងការសង្កេតជាក់លាក់',
      descriptionEn: 'Link feedback to specific observations',
      actionItems: [
        'ឆ្លើយតបទៅនឹងការសង្កេតនីមួយៗ',
        'ផ្តល់ឧទាហរណ៍ពីអ្វីដែលបានឃើញ',
        'ស្នើដំណោះស្រាយសម្រាប់បញ្ហាដែលបានសង្កេត',
      ],
    });
  }

  return suggestions;
}

async function generateProgressAnalysis(data: any) {
  const { progressReports, sessions, relationship } = data;

  const suggestions = [];

  // Analyze progress trends
  if (progressReports.length >= 2) {
    const latestReport = progressReports[0];
    const previousReport = progressReports[1];

    if (latestReport.overallRating < previousReport.overallRating) {
      suggestions.push({
        id: 'rating_decline',
        priority: 'high',
        titleKh: 'ការវាយតម្លៃធ្លាក់ចុះ',
        titleEn: 'Rating Decline',
        descriptionKh: 'ការវាយតម្លៃបានធ្លាក់ចុះ។ ពិនិត្យមើលបញ្ហាប្រឈម។',
        descriptionEn: 'Rating has declined. Review challenges.',
        actionItems: [
          'សាកសួរគ្រូកំពុងរៀនអំពីបញ្ហាប្រឈម',
          'កែតម្រូវយុទ្ធសាស្ត្រណែនាំ',
          'ផ្តល់ការគាំទ្របន្ថែម',
        ],
      });
    }
  }

  // Session completion rate
  const scheduledSessions = sessions.filter((s: any) => s.status === 'SCHEDULED').length;
  const completedSessions = sessions.filter((s: any) => s.status === 'COMPLETED').length;
  const completionRate = completedSessions / (completedSessions + scheduledSessions);

  if (completionRate < 0.8) {
    suggestions.push({
      id: 'low_completion_rate',
      priority: 'medium',
      titleKh: 'អត្រាបញ្ចប់វគ្គទាប',
      titleEn: 'Low Session Completion Rate',
      descriptionKh: `មានតែ ${Math.round(completionRate * 100)}% នៃវគ្គត្រូវបានបញ្ចប់`,
      descriptionEn: `Only ${Math.round(completionRate * 100)}% of sessions completed`,
      recommendations: [
        'ពិនិត្យឡើងវិញនូវកាលវិភាគវគ្គ',
        'កាត់បន្ថយរយៈពេលវគ្គប្រសិនបើចាំបាច់',
        'ប្រើប្រាស់ការរំលឹកស្វ័យប្រវត្តិ',
      ],
    });
  }

  // Goal achievement
  if (relationship.goals) {
    suggestions.push({
      id: 'goal_review',
      priority: 'medium',
      titleKh: 'ពិនិត្យគោលដៅឡើងវិញ',
      titleEn: 'Review Goals',
      descriptionKh: 'វាយតម្លៃវឌ្ឍនភាពឆ្ពោះទៅរកគោលដៅដែលបានកំណត់',
      descriptionEn: 'Evaluate progress towards set goals',
      checkpoints: [
        'តើគោលដៅនៅតែពាក់ព័ន្ធឬទេ?',
        'តើមានវឌ្ឍនភាពដែលអាចវាស់វែងបានឬទេ?',
        'តើត្រូវការកែតម្រូវគោលដៅឬទេ?',
      ],
    });
  }

  return suggestions;
}

async function generateChallengeSolutions(data: any) {
  const { challenges, context } = data;

  const suggestions = [];

  // Map common challenges to solutions
  const challengeSolutions: Record<string, any> = {
    time_management: {
      titleKh: 'ដំណោះស្រាយការគ្រប់គ្រងពេលវេលា',
      titleEn: 'Time Management Solutions',
      solutions: [
        'ប្រើប្រាស់ timer សម្រាប់សកម្មភាពនីមួយៗ',
        'រៀបចំផែនការមេរៀនលម្អិត',
        'រៀនអំពីបច្ចេកទេស chunking',
      ],
    },
    student_engagement: {
      titleKh: 'បង្កើនការចូលរួមរបស់សិស្ស',
      titleEn: 'Increase Student Engagement',
      solutions: [
        'ប្រើប្រាស់សកម្មភាពអន្តរកម្ម',
        'បញ្ចូលហ្គេមអប់រំ',
        'ប្រើប្រាស់ការសិក្សាជាក្រុម',
      ],
    },
    classroom_management: {
      titleKh: 'ការគ្រប់គ្រងថ្នាក់រៀន',
      titleEn: 'Classroom Management',
      solutions: [
        'បង្កើតច្បាប់ថ្នាក់រៀនច្បាស់លាស់',
        'ប្រើប្រាស់ការលើកទឹកចិត្តវិជ្ជមាន',
        'អនុវត្តទម្លាប់ប្រចាំថ្ងៃ',
      ],
    },
  };

  challenges.forEach((challenge: string) => {
    if (challengeSolutions[challenge]) {
      suggestions.push({
        id: `solution_${challenge}`,
        priority: 'high',
        ...challengeSolutions[challenge],
        resources: [
          'វីដេអូគំរូ',
          'ឯកសារណែនាំ',
          'សិក្ខាសាលាអនឡាញ',
        ],
      });
    }
  });

  // Context-specific suggestions
  if (context.gradeLevel) {
    suggestions.push({
      id: 'grade_specific',
      priority: 'medium',
      titleKh: `យុទ្ធសាស្ត្រសម្រាប់ថ្នាក់ទី ${context.gradeLevel}`,
      titleEn: `Strategies for Grade ${context.gradeLevel}`,
      descriptionKh: 'ប្រើប្រាស់វិធីសាស្ត្រសមស្របតាមអាយុ',
      descriptionEn: 'Use age-appropriate methodologies',
      techniques: getGradeSpecificTechniques(context.gradeLevel),
    });
  }

  return suggestions;
}

function getSessionTypeKhmer(type: string): string {
  const types: Record<string, string> = {
    CLASSROOM_OBSERVATION: 'ការសង្កេតក្នុងថ្នាក់រៀន',
    LESSON_PLANNING: 'ការគាំទ្រផែនការបង្រៀន',
    REFLECTIVE_PRACTICE: 'ការអនុវត្តឆ្លុះបញ្ចាំង',
    PEER_LEARNING: 'វង់សិក្សាមិត្តភក្តិ',
  };
  return types[type] || type;
}

function getGradeSpecificTechniques(grade: string): string[] {
  const techniques: Record<string, string[]> = {
    '1-3': [
      'ប្រើប្រាស់រូបភាព និងសម្ភារៈជាក់ស្តែង',
      'សកម្មភាពរយៈពេលខ្លី (10-15 នាទី)',
      'ចលនា និងសកម្មភាពរាងកាយ',
    ],
    '4-6': [
      'ការងារជាក្រុម និងគម្រោង',
      'ការពិភាក្សា និងការបង្ហាញ',
      'ការប្រើប្រាស់បច្ចេកវិទ្យាសមស្រប',
    ],
  };
  
  return techniques[grade] || techniques['4-6'];
}