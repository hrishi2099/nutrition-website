import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    throw new Error('No token provided');
  }

  const { payload } = await verifyJWT(token);
  const userId = payload.userId as string;

  if (!userId) {
    throw new Error('Invalid token');
  }

  return userId;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const body = await request.json();
    
    const { dietPlanId } = body;

    // Validate required fields
    if (!dietPlanId) {
      return NextResponse.json(
        { error: 'Diet plan ID is required' },
        { status: 400 }
      );
    }

    // Check if diet plan exists
    const dietPlan = await prisma.dietPlan.findUnique({
      where: { id: dietPlanId },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
        isActive: true,
      },
    });

    if (!dietPlan) {
      return NextResponse.json(
        { error: 'Diet plan not found' },
        { status: 404 }
      );
    }

    if (!dietPlan.isActive) {
      return NextResponse.json(
        { error: 'Diet plan is not currently available' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled in this plan
    const existingEnrollment = await prisma.dietPlan.findFirst({
      where: {
        id: dietPlanId,
        userId: userId,
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this diet plan' },
        { status: 400 }
      );
    }

    // Create enrollment by linking user to diet plan
    const enrollment = await prisma.dietPlan.update({
      where: { id: dietPlanId },
      data: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in diet plan',
      enrollment: {
        id: enrollment.id,
        planName: enrollment.name,
        price: enrollment.price,
        duration: enrollment.duration,
        enrolledAt: new Date().toISOString(),
        user: user,
      },
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to enroll in diet plan' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from token, but don't fail if not available
    let userId: string | null = null;
    try {
      userId = await getUserFromToken(request);
    } catch {
      console.log('No valid token found, returning empty enrollments');
      return NextResponse.json({
        success: true,
        enrollments: [],
      });
    }

    // Try to get user's enrollments from database
    try {
      const enrollments = await prisma.dietPlan.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          duration: true,
          calories: true,
          mealsPerDay: true,
          price: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        enrollments: enrollments,
      });
    } catch (dbError) {
      console.error('Database error, returning empty enrollments:', dbError);
      return NextResponse.json({
        success: true,
        enrollments: [],
      });
    }

  } catch (error) {
    console.error('Get enrollments error:', error);

    // Always return a valid JSON response
    return NextResponse.json({
      success: false,
      enrollments: [],
      error: 'Failed to fetch enrollments',
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const dietPlanId = searchParams.get('dietPlanId');

    if (!dietPlanId) {
      return NextResponse.json(
        { error: 'Diet plan ID is required' },
        { status: 400 }
      );
    }

    // Check if user is enrolled in this plan
    const enrollment = await prisma.dietPlan.findFirst({
      where: {
        id: dietPlanId,
        userId: userId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this diet plan' },
        { status: 400 }
      );
    }

    // Remove enrollment by setting userId to null
    await prisma.dietPlan.update({
      where: { id: dietPlanId },
      data: {
        userId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from diet plan',
    });

  } catch (error) {
    console.error('Unenrollment error:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to unenroll from diet plan' },
      { status: 500 }
    );
  }
}