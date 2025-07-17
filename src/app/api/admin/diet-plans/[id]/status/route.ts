import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminToken(request);
    const { id } = await context.params;
    const { isActive } = await request.json();

    // Validate isActive
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Update diet plan status
    const dietPlan = await prisma.dietPlan.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      dietPlan,
      message: 'Diet plan status updated successfully',
    });
  } catch (error) {
    console.error('Admin diet plan status update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update diet plan status' 
      },
      { status: 500 }
    );
  }
}