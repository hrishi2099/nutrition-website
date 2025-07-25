import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { validateBlogPost } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const categoryId = searchParams.get('categoryId');
    const tagId = searchParams.get('tagId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const where: {
      published?: boolean;
      categoryId?: string;
      tags?: {
        some: {
          tagId: string;
        };
      };
    } = {};
    
    if (published === 'true') {
      where.published = true;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId
        }
      };
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, categoryId, tagIds, published } = body;

    // Validate blog post data
    const validation = validateBlogPost(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Use the authenticated admin user as the author
    const authorId = adminUser.id;

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        categoryId,
        authorId,
        published: published || false,
        publishedAt: published ? new Date() : null,
        tags: tagIds ? {
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}