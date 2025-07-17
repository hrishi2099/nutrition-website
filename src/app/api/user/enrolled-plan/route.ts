import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    throw new Error('No token provided');
  }

  const { payload } = await jwtVerify(token, secret);
  const userId = payload.userId as string;

  if (!userId) {
    throw new Error('Invalid token');
  }

  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    // Get user's enrolled diet plan
    const enrolledPlan = await prisma.dietPlan.findFirst({
      where: { 
        userId: userId,
        isActive: true,
      },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    if (!enrolledPlan) {
      return NextResponse.json({
        success: true,
        enrolled: false,
        message: 'No active enrollment found'
      });
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      dietPlan: enrolledPlan,
    });

  } catch (error) {
    console.error('Get enrolled plan error:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({
        success: false,
        enrolled: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      enrolled: false,
      error: 'Failed to fetch enrollment status'
    }, { status: 500 });
  }
}