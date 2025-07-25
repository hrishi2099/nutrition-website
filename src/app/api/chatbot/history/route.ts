import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return null;
    }

    const { payload } = await verifyJWT(token);
    const userId = payload.userId as string;

    if (!userId) {
      return null;
    }

    return { id: userId };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId }: { sessionId: string } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get user from token for authorization
    const user = await getUserFromToken(request);
    
    // First check if the session exists and get session details
    const session = await prisma.chatSession.findFirst({
      where: { sessionId },
      select: { id: true, userId: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Authorization check: user must own the session or session must be anonymous
    if (session.userId && (!user || session.userId !== user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized access to chat history' },
        { status: 403 }
      );
    }

    // Get session messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        session: {
          sessionId: sessionId
        }
      },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}