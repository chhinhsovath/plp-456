import { NextRequest, NextResponse } from 'next/server';
import { analyzeObservation } from '@/lib/ai/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const observationData = await request.json();
    
    if (!observationData) {
      return NextResponse.json(
        { error: 'Observation data is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeObservation(observationData);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in AI analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze observation' },
      { status: 500 }
    );
  }
}