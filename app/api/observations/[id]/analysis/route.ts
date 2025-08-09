import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    
    // Get AI analysis for this observation
    const aiAnalysis = await prisma.aiAnalysisResult.findMany({
      where: { 
        inspectionSessionId: id 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!aiAnalysis || aiAnalysis.length === 0) {
      return NextResponse.json(
        { 
          message: 'No AI analysis found for this observation',
          inspectionSessionId: id 
        }, 
        { status: 404 }
      );
    }

    // Return all analysis types for this observation
    const analysisMap: Record<string, any> = {};
    for (const analysis of aiAnalysis) {
      analysisMap[analysis.analysisType] = {
        id: analysis.id,
        overallScore: analysis.overallScore,
        performanceLevel: analysis.performanceLevel,
        strengths: analysis.strengths,
        areasForImprovement: analysis.areasForImprovement,
        recommendations: analysis.recommendations,
        detailedFeedback: analysis.detailedFeedback,
        language: analysis.language,
        metadata: analysis.metadata,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        createdBy: analysis.createdBy
      };
    }

    return NextResponse.json({
      inspectionSessionId: id,
      analyses: analysisMap,
      count: aiAnalysis.length
    });

  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI analysis' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const { analysisType = 'general' } = await request.json().catch(() => ({}));
    
    // Delete specific analysis type or all if not specified
    if (analysisType === 'all') {
      await prisma.aiAnalysisResult.deleteMany({
        where: { inspectionSessionId: id }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'All AI analyses deleted for this observation' 
      });
    } else {
      const deleted = await prisma.aiAnalysisResult.delete({
        where: {
          inspectionSessionId_analysisType: {
            inspectionSessionId: id,
            analysisType: analysisType
          }
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `AI analysis of type '${analysisType}' deleted`,
        deleted: deleted.id
      });
    }

  } catch (error) {
    console.error('Error deleting AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI analysis' },
      { status: 500 }
    );
  }
}