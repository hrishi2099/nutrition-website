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

    const example = await prisma.trainingExample.findUnique({
      where: { id },
      include: {
        intent: {
          select: { name: true }
        }
      }
    });

    if (!example) {
      return NextResponse.json({ error: 'Example not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      example
    });
  } catch (error) {
    console.error('Error fetching training example:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training example' },
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

    const example = await prisma.trainingExample.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      example
    });
  } catch (error) {
    console.error('Error updating training example:', error);
    return NextResponse.json(
      { error: 'Failed to update training example' },
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

    await prisma.trainingExample.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Example deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training example:', error);
    return NextResponse.json(
      { error: 'Failed to delete training example' },
      { status: 500 }
    );
  }
}