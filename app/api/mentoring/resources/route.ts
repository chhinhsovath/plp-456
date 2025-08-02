import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { put } from '@vercel/blob';

// Validation schema
const createResourceSchema = z.object({
  title: z.string().min(1),
  titleKh: z.string().min(1),
  description: z.string().optional(),
  descriptionKh: z.string().optional(),
  type: z.enum(['DOCUMENT', 'VIDEO', 'PRESENTATION', 'TEMPLATE', 'GUIDE', 'CHECKLIST']),
  category: z.enum([
    'TEACHING_METHODS',
    'CLASSROOM_MANAGEMENT',
    'STUDENT_ENGAGEMENT',
    'ASSESSMENT',
    'TECHNOLOGY',
    'LESSON_PLANNING',
    'PROFESSIONAL_DEVELOPMENT'
  ]),
  tags: z.array(z.string()),
  language: z.enum(['km', 'en', 'both']),
  isPublic: z.boolean().default(true),
});

// GET - Fetch resources with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const language = searchParams.get('language');
    const search = searchParams.get('search');
    const favorites = searchParams.get('favorites') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: any = {
      OR: [
        { isPublic: true },
        { uploadedBy: session.user.id }
      ]
    };

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (language) {
      where.language = language;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleKh: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } },
        { descriptionKh: { contains: search } },
        { tags: { has: search } },
      ];
    }

    if (favorites) {
      const favoriteResources = await prisma.resourceFavorite.findMany({
        where: { userId: session.user.id },
        select: { resourceId: true },
      });
      where.id = { in: favoriteResources.map(f => f.resourceId) };
    }

    const [resources, total] = await Promise.all([
      prisma.mentoringResource.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
            },
          },
          favorites: {
            where: { userId: session.user.id },
            select: { id: true },
          },
          _count: {
            select: {
              favorites: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mentoringResource.count({ where }),
    ]);

    // Transform to include isFavorited flag
    const transformedResources = resources.map(resource => ({
      ...resource,
      isFavorited: resource.favorites.length > 0,
      favoriteCount: resource._count.favorites,
      favorites: undefined,
      _count: undefined,
    }));

    return NextResponse.json({
      resources: transformedResources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST - Upload a new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const data = JSON.parse(formData.get('data') as string);

    const validatedData = createResourceSchema.parse(data);

    let fileUrl = null;
    let thumbnailUrl = null;

    // Upload file if provided
    if (file) {
      const blob = await put(file.name, file, {
        access: 'public',
      });
      fileUrl = blob.url;

      // Generate thumbnail for videos/presentations
      if (validatedData.type === 'VIDEO' || validatedData.type === 'PRESENTATION') {
        // TODO: Implement thumbnail generation
        thumbnailUrl = fileUrl; // Placeholder
      }
    }

    const resource = await prisma.mentoringResource.create({
      data: {
        ...validatedData,
        fileUrl,
        thumbnailUrl,
        uploadedBy: session.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}

// PATCH - Update resource
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Check ownership
    const existingResource = await prisma.mentoringResource.findUnique({
      where: { id: resourceId },
      select: { uploadedBy: true },
    });

    if (!existingResource || existingResource.uploadedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this resource' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const resource = await prisma.mentoringResource.update({
      where: { id: resourceId },
      data: body,
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    );
  }
}

// DELETE - Remove resource
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('id');

    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }

    // Check ownership
    const existingResource = await prisma.mentoringResource.findUnique({
      where: { id: resourceId },
      select: { uploadedBy: true },
    });

    if (!existingResource || existingResource.uploadedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this resource' },
        { status: 403 }
      );
    }

    await prisma.mentoringResource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    );
  }
}