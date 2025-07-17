import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request);

    const dietPlans = await prisma.dietPlan.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        meals: {
          select: {
            id: true,
            name: true,
            type: true,
            calories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      dietPlans,
    });
  } catch (error) {
    console.error('Admin diet plans fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch diet plans' 
      },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdminToken(request);
    const { name, description, type, duration, calories, mealsPerDay, price } = await request.json();

    // Validate required fields
    if (!name || !description || !type || !duration || !calories || !mealsPerDay || !price) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const dietPlan = await prisma.dietPlan.create({
      data: {
        name,
        description,
        type,
        duration,
        calories,
        mealsPerDay,
        price,
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        meals: {
          select: {
            id: true,
            name: true,
            type: true,
            calories: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      dietPlan,
      message: 'Diet plan created successfully',
    });
  } catch (error) {
    console.error('Admin diet plan creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create diet plan' 
      },
      { status: 500 }
    );
  }
}