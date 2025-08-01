import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    if (userId) {
      // Get user's earned badges
      const userBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
        orderBy: { earnedDate: 'desc' },
      });

      return NextResponse.json({ userBadges });
    } else {
      // Get all available badges
      const badges = await prisma.badge.findMany({
        where: {
          isActive: true,
          ...(category && { category }),
        },
        orderBy: [{ level: 'asc' }, { category: 'asc' }],
      });

      return NextResponse.json({ badges });
    }
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
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

    // Check if badge exists
    const badge = await prisma.badge.findUnique({
      where: { id: data.badgeId },
    });

    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
    }

    // Check if user already has this badge
    const existingBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: data.userId,
          badgeId: data.badgeId,
        },
      },
    });

    if (existingBadge) {
      return NextResponse.json({ error: 'User already has this badge' }, { status: 400 });
    }

    // Award badge to user
    const userBadge = await prisma.userBadge.create({
      data: {
        userId: data.userId,
        badgeId: data.badgeId,
        earnedFor: data.earnedFor,
        metadata: data.metadata,
      },
      include: {
        badge: true,
      },
    });

    return NextResponse.json({ userBadge });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
  }
}

// Check badge criteria and auto-award if eligible
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const { userId } = await request.json();

    // Get all active badges
    const badges = await prisma.badge.findMany({
      where: { isActive: true },
    });

    // Get user's current badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
    const newBadges = [];

    // Check each badge criteria
    for (const badge of badges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as any;
      let eligible = false;
      let earnedFor = '';

      // Check different criteria types
      if (criteria.type === 'sessions_completed') {
        const sessionCount = await prisma.mentoringSession.count({
          where: {
            OR: [
              { relationship: { mentorId: userId } },
              { relationship: { menteeId: userId } },
            ],
            status: 'COMPLETED',
          },
        });

        if (sessionCount >= criteria.count) {
          eligible = true;
          earnedFor = `បានបញ្ចប់វគ្គចំនួន ${sessionCount} វគ្គ`;
        }
      } else if (criteria.type === 'mentoring_duration') {
        const relationships = await prisma.mentoringRelationship.findMany({
          where: {
            OR: [
              { mentorId: userId },
              { menteeId: userId },
            ],
            status: 'ACTIVE',
          },
        });

        const longestDuration = relationships.reduce((max, rel) => {
          const duration = Math.floor((Date.now() - new Date(rel.startDate).getTime()) / (1000 * 60 * 60 * 24));
          return Math.max(max, duration);
        }, 0);

        if (longestDuration >= criteria.days) {
          eligible = true;
          earnedFor = `កម្មវិធីណែនាំរយៈពេល ${longestDuration} ថ្ងៃ`;
        }
      } else if (criteria.type === 'feedback_excellence') {
        const avgRating = await prisma.$queryRaw<[{ avg: number }]>`
          SELECT AVG(rating) as avg
          FROM mentoring_feedback
          WHERE mentee_id = ${userId}
          AND rating IS NOT NULL
        `;

        if (avgRating[0]?.avg >= criteria.minRating) {
          eligible = true;
          earnedFor = `ការវាយតម្លៃជាមធ្យម ${avgRating[0].avg.toFixed(1)}/5`;
        }
      }

      if (eligible) {
        const userBadge = await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            earnedFor,
            metadata: { autoAwarded: true },
          },
          include: {
            badge: true,
          },
        });
        newBadges.push(userBadge);
      }
    }

    return NextResponse.json({ newBadges });
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    return NextResponse.json({ error: 'Failed to check badge eligibility' }, { status: 500 });
  }
}