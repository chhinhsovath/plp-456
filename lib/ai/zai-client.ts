import axios from 'axios';
import { mockAIRequest } from './mock-ai';

// Z.AI API configuration
const API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
const USE_MOCK = process.env.NODE_ENV === 'development' && !process.env.FORCE_REAL_API;

export const getApiHeaders = () => {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey && !USE_MOCK) {
    throw new Error('ZAI_API_KEY is not configured');
  }
  
  return {
    'Authorization': apiKey || '',
    'Content-Type': 'application/json',
  };
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
  // Use mock in development if API key is not set
  if (USE_MOCK) {
    console.log('Using mock AI response (development mode)');
    return mockAIRequest(messages, options);
  }

  try {
    const headers = getApiHeaders();
    
    const requestBody: any = {
      model: 'glm-4-0520',  // Using GLM-4 model as GLM-4.5 might need different endpoint
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4000,
    };

    // Add thinking mode if requested
    if (options?.thinking) {
      requestBody.tools = [{
        type: 'web_search',
        web_search: {
          enable: true
        }
      }];
    }

    const response = await axios.post(
      `${API_BASE_URL}/chat/completions`,
      requestBody,
      { headers }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    
    return {
      content,
      usage: response.data.usage ? {
        inputTokens: response.data.usage.prompt_tokens,
        outputTokens: response.data.usage.completion_tokens,
      } : undefined,
    };
  } catch (error) {
    console.error('AI request failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      // Fall back to mock in development on API errors
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to mock AI response due to API error');
        return mockAIRequest(messages, options);
      }
      throw new Error(error.response?.data?.error?.message || 'Failed to process AI request');
    }
    throw new Error('Failed to process AI request');
  }
}