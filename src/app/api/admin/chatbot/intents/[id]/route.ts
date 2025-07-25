import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

async function getAdminUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await verifyJWT(token);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const intent = await prisma.trainingIntent.findUnique({
      where: { id },
      include: {
        examples: {
          orderBy: { createdAt: 'desc' }
        },
        responses: {
          orderBy: { priority: 'desc' }
        }
      }
    });

    if (!intent) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      intent
    });
  } catch (error) {
    console.error('Error fetching training intent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training intent' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const intent = await prisma.trainingIntent.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
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
    console.error('Error updating training intent:', error);
    return NextResponse.json(
      { error: 'Failed to update training intent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete the intent (cascade will handle examples and responses)
    await prisma.trainingIntent.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Intent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training intent:', error);
    return NextResponse.json(
      { error: 'Failed to delete training intent' },
      { status: 500 }
    );
  }
}