import axios from 'axios';

// Alternative implementation using OpenAI-compatible format
// This can be used if the Zhipu API doesn't work as expected

const OPENAI_COMPATIBLE_URL = 'https://api.openai.com/v1/chat/completions';

export const getOpenAIHeaders = () => {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new Error('ZAI_API_KEY is not configured');
  }
  
  return {
    'Authorization': `Bearer ${apiKey}`,
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

// OpenAI-compatible request
export async function makeOpenAIRequest(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    thinking?: boolean;
  }
): Promise<AIResponse> {
  try {
    const headers = getOpenAIHeaders();
    
    const requestBody = {
      model: 'glm-4.5',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4000,
    };

    const response = await axios.post(
      OPENAI_COMPATIBLE_URL,
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
    console.error('OpenAI-compatible request failed:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
    }
    throw new Error('Failed to process AI request');
  }
}