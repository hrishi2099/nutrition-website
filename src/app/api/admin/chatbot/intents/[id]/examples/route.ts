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

function extractKeywords(userInput: string): string[] {
  return userInput
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 10);
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
    const { userInput, confidence } = await request.json();

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      );
    }

    if (confidence < 0 || confidence > 1) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 1' },
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

    // Extract keywords from user input
    const keywords = extractKeywords(userInput);

    const example = await prisma.trainingExample.create({
      data: {
        userInput: userInput.trim(),
        keywords: JSON.stringify(keywords),
        confidence: confidence || 1.0,
        intentId
      }
    });

    return NextResponse.json({
      success: true,
      example
    });
  } catch (error) {
    console.error('Error creating training example:', error);
    return NextResponse.json(
      { error: 'Failed to create training example' },
      { status: 500 }
    );
  }
}