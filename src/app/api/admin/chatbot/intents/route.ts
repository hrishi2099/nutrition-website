import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

async function getAdminUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const intents = await prisma.trainingIntent.findMany({
      include: {
        _count: {
          select: {
            examples: true,
            responses: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      intents
    });
  } catch (error) {
    console.error('Error fetching training intents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training intents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, category, priority } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Intent name is required' },
        { status: 400 }
      );
    }

    // Check if intent name already exists
    const existingIntent = await prisma.trainingIntent.findUnique({
      where: { name: name.trim() }
    });

    if (existingIntent) {
      return NextResponse.json(
        { error: 'Intent name already exists' },
        { status: 400 }
      );
    }

    const intent = await prisma.trainingIntent.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        priority: priority || 0,
        createdBy: adminUser.id
      },
      include: {
        _count: {
          select: {
            examples: true,
            responses: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      intent
    });
  } catch (error) {
    console.error('Error creating training intent:', error);
    return NextResponse.json(
      { error: 'Failed to create training intent' },
      { status: 500 }
    );
  }
}