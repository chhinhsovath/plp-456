import { makeAIRequest } from './zai-client';

export interface TranslationRequest {
  text: string;
  sourceLang: 'en' | 'km';
  targetLang: 'en' | 'km';
  context?: string;
}

export interface BatchTranslationRequest {
  texts: string[];
  sourceLang: 'en' | 'km';
  targetLang: 'en' | 'km';
  context?: string;
}

// Translate single text
export async function translateText(request: TranslationRequest): Promise<string> {
  if (request.sourceLang === request.targetLang) {
    return request.text;
  }

  const prompt = `
Translate the following text from ${request.sourceLang === 'en' ? 'English' : 'Khmer'} to ${request.targetLang === 'en' ? 'English' : 'Khmer'}:

Text: "${request.text}"
${request.context ? `Context: ${request.context}` : ''}

Provide only the translation, no explanations or additional text.
For educational terms, use standard academic translations.
`;

  const response = await makeAIRequest([
    {
      role: 'system',
      content: 'You are a professional translator specializing in educational content. Provide accurate, contextually appropriate translations.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.3,
  });

  return response.content.trim();
}

// Translate multiple texts in batch
export async function translateBatch(request: BatchTranslationRequest): Promise<string[]> {
  if (request.sourceLang === request.targetLang) {
    return request.texts;
  }

  const prompt = `
Translate the following texts from ${request.sourceLang === 'en' ? 'English' : 'Khmer'} to ${request.targetLang === 'en' ? 'English' : 'Khmer'}:

${request.texts.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

${request.context ? `Context: ${request.context}` : ''}

Return a JSON array with translations in the same order:
["translation1", "translation2", ...]
`;

  const response = await makeAIRequest([
    {
      role: 'system',
      content: 'You are a professional translator. Return only a JSON array of translations.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.3,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse translations:', error);
    return request.texts;
  }
}

// Translate form labels and UI elements
export async function translateFormLabels(
  labels: Record<string, string>,
  targetLang: 'en' | 'km'
): Promise<Record<string, string>> {
  const sourceLang = targetLang === 'en' ? 'km' : 'en';
  const keys = Object.keys(labels);
  const values = Object.values(labels);

  const translations = await translateBatch({
    texts: values,
    sourceLang,
    targetLang,
    context: 'Educational observation form labels and UI elements',
  });

  const result: Record<string, string> = {};
  keys.forEach((key, i) => {
    result[key] = translations[i] || values[i];
  });

  return result;
}

// Generate bilingual content
export async function generateBilingualContent(
  content: string,
  primaryLang: 'en' | 'km'
): Promise<{
  primary: string;
  secondary: string;
  combined: string;
}> {
  const secondaryLang = primaryLang === 'en' ? 'km' : 'en';
  const translation = await translateText({
    text: content,
    sourceLang: primaryLang,
    targetLang: secondaryLang,
  });

  return {
    primary: content,
    secondary: translation,
    combined: `${content}\n(${translation})`,
  };
}