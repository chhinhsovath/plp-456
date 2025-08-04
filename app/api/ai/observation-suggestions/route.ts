import { NextRequest, NextResponse } from 'next/server';
import { generateObservationSuggestions } from '@/lib/ai/observation-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, grade, chapter, lesson, language } = body;

    if (!subject || !grade) {
      return NextResponse.json(
        { error: 'Subject and grade are required' },
        { status: 400 }
      );
    }

    const suggestions = await generateObservationSuggestions({
      subject,
      grade: parseInt(grade),
      chapter,
      lesson,
      language: language || 'en',
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}