import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const dietPlan = await prisma.dietPlan.findUnique({
      where: { id },
      include: {
        meals: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    if (!dietPlan) {
      return NextResponse.json(
        { error: 'Diet plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dietPlan,
    });
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diet plan' },
      { status: 500 }
    );
  }
}