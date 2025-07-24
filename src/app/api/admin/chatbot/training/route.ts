import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { trainingMatcher } from '@/lib/chatbotTraining';

async function getAdminUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { prisma } = await import('@/lib/prisma');
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

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'refresh_cache':
        await trainingMatcher.refreshCache();
        return NextResponse.json({
          success: true,
          message: 'Training cache refreshed successfully'
        });

      case 'test_match':
        const { message, context } = await request.json();
        if (!message) {
          return NextResponse.json(
            { error: 'Message is required for testing' },
            { status: 400 }
          );
        }

        const match = await trainingMatcher.findBestMatch(message, context || {});
        return NextResponse.json({
          success: true,
          match: match || null,
          tested_message: message
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in training management:', error);
    return NextResponse.json(
      { error: 'Failed to process training action' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get training statistics and analytics
    const stats = await trainingMatcher.getMatchStatistics();
    
    return NextResponse.json({
      success: true,
      statistics: stats,
      system_status: {
        cache_active: true,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching training analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training analytics' },
      { status: 500 }
    );
  }
}