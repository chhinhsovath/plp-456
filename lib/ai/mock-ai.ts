// Mock AI responses for development/testing when API is not available

import { AIResponse, ObservationSuggestion, ObservationAnalysis, TeacherRecommendation } from './zai-client';

export async function mockAIRequest(
  messages: Array<{ role: string; content: string }>,
  options?: any
): Promise<AIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Generate mock response based on request type
  if (lastMessage.includes('lesson title') || lastMessage.includes('suggestions')) {
    return {
      content: JSON.stringify({
        lessonTitle: "Introduction to Fractions: Understanding Parts of a Whole",
        lessonObjectives: [
          "Students will identify and name fractions",
          "Students will represent fractions using visual models",
          "Students will compare simple fractions",
          "Students will relate fractions to real-world examples"
        ],
        teachingMethods: [
          "Visual demonstration with fraction circles",
          "Hands-on activities with fraction bars",
          "Group work with pizza/cake examples",
          "Interactive games for fraction recognition"
        ],
        evaluationCriteria: [
          "Can correctly identify fractions from visual representations",
          "Demonstrates understanding of numerator and denominator",
          "Can create visual models of given fractions",
          "Applies fraction concepts to solve simple problems"
        ],
        expectedOutcomes: [
          "90% of students can identify basic fractions",
          "Students can explain fractions in their own words",
          "Students show confidence in working with fraction models"
        ]
      })
    };
  }

  if (lastMessage.includes('analyze') || lastMessage.includes('observation data')) {
    return {
      content: JSON.stringify({
        strengths: [
          "Clear lesson objectives communicated to students",
          "Effective use of visual aids and manipulatives",
          "Good classroom management and student engagement",
          "Appropriate pacing of lesson content"
        ],
        areasForImprovement: [
          "Include more opportunities for student discussion",
          "Provide differentiated activities for various skill levels",
          "Incorporate technology tools for interactive learning"
        ],
        recommendations: [
          "Use exit tickets to assess individual student understanding",
          "Implement think-pair-share activities",
          "Create extension activities for advanced learners"
        ],
        overallScore: 7.5,
        detailedFeedback: "The teacher demonstrated strong content knowledge and effective teaching strategies. The lesson was well-structured with clear objectives. Student engagement was high throughout most of the lesson. Consider incorporating more formative assessment techniques to gauge individual student progress during the lesson."
      })
    };
  }

  if (lastMessage.includes('professional development') || lastMessage.includes('recommendations')) {
    return {
      content: JSON.stringify({
        professionalDevelopment: [
          "Differentiated Instruction Workshop (2-day intensive)",
          "Technology Integration in Mathematics Education",
          "Formative Assessment Strategies Course",
          "Collaborative Learning Techniques Seminar"
        ],
        resources: [
          "Visual Mathematics Teaching Toolkit",
          "Online fraction manipulatives library",
          "Assessment rubrics for mathematical thinking",
          "Peer observation guidelines and templates"
        ],
        strategies: [
          "Implement daily exit tickets for quick assessments",
          "Use think-aloud strategies to model problem-solving",
          "Create heterogeneous groups for collaborative work",
          "Develop a bank of differentiated activities"
        ],
        timeline: "3-month implementation plan with bi-weekly check-ins and monthly peer observations"
      })
    };
  }

  if (lastMessage.includes('translate')) {
    const textMatch = lastMessage.match(/Text: "(.+?)"/);
    const text = textMatch ? textMatch[1] : '';
    
    // Simple mock translation
    const mockTranslations: { [key: string]: string } = {
      "The teacher demonstrated excellent classroom management skills.": "គ្រូបានបង្ហាញជំនាញគ្រប់គ្រងថ្នាក់រៀនដ៏ល្អឥតខ្ចោះ។",
      "Students were engaged throughout the lesson.": "សិស្សបានចូលរួមយ៉ាងសកម្មពេញមួយមេរៀន។",
    };

    return {
      content: mockTranslations[text] || "បកប្រែ: " + text
    };
  }

  // Default response
  return {
    content: "Mock AI response for: " + lastMessage.substring(0, 100)
  };
}

// Mock observation suggestions
export function getMockObservationSuggestions(): ObservationSuggestion {
  return {
    lessonTitle: "Exploring Fractions in Daily Life",
    lessonObjectives: [
      "Identify fractions in everyday situations",
      "Use fraction vocabulary correctly",
      "Solve simple fraction problems"
    ],
    teachingMethods: [
      "Interactive demonstrations",
      "Peer learning activities",
      "Real-world problem solving"
    ],
    evaluationCriteria: [
      "Accuracy in fraction identification",
      "Proper use of mathematical vocabulary",
      "Problem-solving approach"
    ],
    expectedOutcomes: [
      "Students can apply fraction concepts",
      "Improved mathematical communication",
      "Increased confidence with fractions"
    ]
  };
}

// Mock observation analysis
export function getMockObservationAnalysis(): ObservationAnalysis {
  return {
    strengths: [
      "Excellent lesson preparation",
      "Strong student rapport",
      "Creative use of resources"
    ],
    areasForImprovement: [
      "Time management during activities",
      "More individual student feedback",
      "Assessment variety"
    ],
    recommendations: [
      "Use timer for activity transitions",
      "Implement peer assessment",
      "Try digital assessment tools"
    ],
    overallScore: 8,
    detailedFeedback: "This was a well-executed lesson with clear learning objectives and strong student engagement. The teacher's enthusiasm was evident and contributed to a positive learning environment."
  };
}

// Mock teacher recommendations
export function getMockTeacherRecommendations(): TeacherRecommendation {
  return {
    professionalDevelopment: [
      "Advanced Classroom Management Techniques",
      "Digital Tools for Mathematics Education",
      "Student-Centered Learning Approaches"
    ],
    resources: [
      "Mathematics Teaching Best Practices Guide",
      "Interactive Whiteboard Activity Collection",
      "Formative Assessment Toolkit"
    ],
    strategies: [
      "Implement daily learning objectives review",
      "Use exit tickets for quick assessments",
      "Create student learning portfolios"
    ],
    timeline: "6-week improvement cycle with weekly self-reflection"
  };
}