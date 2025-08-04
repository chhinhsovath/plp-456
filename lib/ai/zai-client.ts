import { ZaiClient } from 'zai';

// Initialize the ZAI client
let client: ZaiClient | null = null;

export const getZaiClient = () => {
  if (!client) {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey) {
      throw new Error('ZAI_API_KEY is not configured');
    }
    client = new ZaiClient({ apiKey });
  }
  return client;
};

// Types for AI responses
export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ObservationSuggestion {
  lessonTitle?: string;
  lessonObjectives?: string[];
  teachingMethods?: string[];
  evaluationCriteria?: string[];
  expectedOutcomes?: string[];
}

export interface ObservationAnalysis {
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  overallScore: number;
  detailedFeedback: string;
}

export interface TeacherRecommendation {
  professionalDevelopment: string[];
  resources: string[];
  strategies: string[];
  timeline: string;
}

// Helper function to make AI requests
export async function makeAIRequest(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    thinking?: boolean;
  }
): Promise<AIResponse> {
  try {
    const client = getZaiClient();
    const response = await client.chat.completions.create({
      model: 'glm-4.5',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4000,
      thinking: options?.thinking ? { type: 'enabled' } : undefined,
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      content,
      usage: response.usage ? {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('AI request failed:', error);
    throw new Error('Failed to process AI request');
  }
}