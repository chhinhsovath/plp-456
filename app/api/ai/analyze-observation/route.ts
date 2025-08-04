import { NextRequest, NextResponse } from 'next/server';
import { analyzeObservation } from '@/lib/ai/observation-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { observationData } = body;

    if (!observationData) {
      return NextResponse.json(
        { error: 'Observation data is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeObservation(observationData);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing observation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze observation' },
      { status: 500 }
    );
  }
}