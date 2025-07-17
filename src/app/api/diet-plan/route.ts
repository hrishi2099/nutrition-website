import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dietPlans = await prisma.dietPlan.findMany({
      where: {
        isActive: true,
        userId: null, // Only get plans that are not assigned to any user
      },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      dietPlans,
    });
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diet plans' },
      { status: 500 }
    );
  }
}