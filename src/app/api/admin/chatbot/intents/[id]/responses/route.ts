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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: intentId } = await params;
    const { response, responseType, priority, conditions, variables } = await request.json();

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }

    const validResponseTypes = ['text', 'template', 'function'];
    if (responseType && !validResponseTypes.includes(responseType)) {
      return NextResponse.json(
        { error: 'Invalid response type' },
        { status: 400 }
      );
    }

    // Verify intent exists
    const intent = await prisma.trainingIntent.findUnique({
      where: { id: intentId }
    });

    if (!intent) {
      return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
    }

    const trainingResponse = await prisma.trainingResponse.create({
      data: {
        response: response.trim(),
        responseType: responseType || 'text',
        priority: priority || 0,
        conditions: conditions || {},
        variables: variables || {},
        intentId,
        createdBy: adminUser.id
      }
    });

    return NextResponse.json({
      success: true,
      response: trainingResponse
    });
  } catch (error) {
    console.error('Error creating training response:', error);
    return NextResponse.json(
      { error: 'Failed to create training response' },
      { status: 500 }
    );
  }
}