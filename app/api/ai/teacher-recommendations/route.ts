import { NextRequest, NextResponse } from 'next/server';
import { generateTeacherRecommendations } from '@/lib/ai/observation-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherHistory, latestObservation } = body;

    if (!latestObservation) {
      return NextResponse.json(
        { error: 'Latest observation data is required' },
        { status: 400 }
      );
    }

    const recommendations = await generateTeacherRecommendations(
      teacherHistory || [],
      latestObservation
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}