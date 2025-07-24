import { NextResponse } from 'next/server';
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

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
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

    // Get training statistics
    const [
      totalIntents,
      activeIntents,
      totalExamples,
      totalResponses,
      avgConfidenceResult
    ] = await Promise.all([
      prisma.trainingIntent.count(),
      prisma.trainingIntent.count({ where: { isActive: true } }),
      prisma.trainingExample.count({ where: { isActive: true } }),
      prisma.trainingResponse.count({ where: { isActive: true } }),
      prisma.trainingExample.aggregate({
        _avg: { confidence: true },
        where: { isActive: true }
      })
    ]);

    const stats = {
      totalIntents,
      activeIntents,
      totalExamples,
      totalResponses,
      avgConfidence: avgConfidenceResult._avg.confidence || 0
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching chatbot stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chatbot stats' },
      { status: 500 }
    );
  }
}