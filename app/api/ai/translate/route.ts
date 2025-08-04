import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch } from '@/lib/ai/translation-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, sourceLang, targetLang, context } = body;

    if (!sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Source and target languages are required' },
        { status: 400 }
      );
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      const translations = await translateBatch({
        texts,
        sourceLang,
        targetLang,
        context,
      });
      return NextResponse.json({ translations });
    }

    // Handle single translation
    if (text) {
      const translation = await translateText({
        text,
        sourceLang,
        targetLang,
        context,
      });
      return NextResponse.json({ translation });
    }

    return NextResponse.json(
      { error: 'Either text or texts array is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error translating:', error);
    return NextResponse.json(
      { error: 'Failed to translate' },
      { status: 500 }
    );
  }
}