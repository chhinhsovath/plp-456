import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

// Generate unique certificate number
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PLP-CERT-${year}-${random}`;
}

// Generate verification code
function generateVerificationCode(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const verificationCode = searchParams.get('verify');

    if (verificationCode) {
      // Verify certificate
      const certificate = await prisma.certificate.findUnique({
        where: { verificationCode },
        include: {
          user: {
            select: { name: true, email: true },
          },
          template: true,
        },
      });

      if (!certificate) {
        return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        certificate,
        isValid: !certificate.isRevoked && (!certificate.expiryDate || certificate.expiryDate > new Date()),
      });
    } else if (userId) {
      // Get user's certificates
      const certificates = await prisma.certificate.findMany({
        where: { userId },
        include: {
          template: true,
        },
        orderBy: { issuedDate: 'desc' },
      });

      return NextResponse.json({ certificates });
    } else {
      // Get certificate templates
      const templates = await prisma.certificateTemplate.findMany({
        where: { isActive: true },
        orderBy: { type: 'asc' },
      });

      return NextResponse.json({ templates });
    }
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const data = await request.json();

    // Get template
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Calculate expiry date if applicable
    let expiryDate = null;
    if (template.validityDays) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + template.validityDays);
    }

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        certificateNo: generateCertificateNumber(),
        userId: data.userId,
        templateId: data.templateId,
        achievementData: data.achievementData,
        expiryDate,
        verificationCode: generateVerificationCode(),
        metadata: data.metadata,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        template: true,
      },
    });

    // TODO: Generate PDF and upload to storage
    // This would involve creating a PDF from the template with user data

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}

// Revoke certificate
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { certificateId, reason } = await request.json();

    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        isRevoked: true,
        revokedReason: reason,
      },
    });

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return NextResponse.json({ error: 'Failed to revoke certificate' }, { status: 500 });
  }
}

// Check certificate eligibility
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { userId, templateCode } = await request.json();

    const template = await prisma.certificateTemplate.findUnique({
      where: { code: templateCode },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const criteria = template.criteria as any;
    let eligible = false;
    let achievementData = {};

    // Check different criteria types
    if (criteria.type === 'mentoring_program_completion') {
      const completedProgram = await prisma.mentoringRelationship.findFirst({
        where: {
          OR: [
            { mentorId: userId },
            { menteeId: userId },
          ],
          status: 'COMPLETED',
          sessions: {
            some: {
              status: 'COMPLETED',
            },
          },
        },
        include: {
          sessions: {
            where: { status: 'COMPLETED' },
          },
          progressReports: true,
        },
      });

      if (completedProgram && completedProgram.sessions.length >= criteria.minSessions) {
        eligible = true;
        achievementData = {
          programId: completedProgram.id,
          sessionsCompleted: completedProgram.sessions.length,
          startDate: completedProgram.startDate,
          endDate: completedProgram.endDate,
        };
      }
    } else if (criteria.type === 'excellence_in_mentoring') {
      const excellenceData = await prisma.$queryRaw<[{ avgRating: number, totalSessions: number }]>`
        SELECT 
          AVG(mf.rating) as avgRating,
          COUNT(DISTINCT ms.id) as totalSessions
        FROM mentoring_sessions ms
        JOIN mentoring_relationships mr ON ms.relationship_id = mr.id
        LEFT JOIN mentoring_feedback mf ON mf.session_id = ms.id
        WHERE mr.mentor_id = ${userId}
        AND ms.status = 'COMPLETED'
      `;

      if (excellenceData[0]?.avgRating >= criteria.minRating && 
          excellenceData[0]?.totalSessions >= criteria.minSessions) {
        eligible = true;
        achievementData = {
          averageRating: excellenceData[0].avgRating,
          totalSessions: excellenceData[0].totalSessions,
        };
      }
    }

    if (eligible) {
      // Check if user already has this certificate
      const existingCert = await prisma.certificate.findFirst({
        where: {
          userId,
          templateId: template.id,
          isRevoked: false,
        },
      });

      if (existingCert) {
        return NextResponse.json({ 
          eligible: false, 
          reason: 'User already has this certificate' 
        });
      }

      return NextResponse.json({ 
        eligible: true, 
        achievementData,
        template,
      });
    }

    return NextResponse.json({ 
      eligible: false, 
      reason: 'Criteria not met' 
    });
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 });
  }
}