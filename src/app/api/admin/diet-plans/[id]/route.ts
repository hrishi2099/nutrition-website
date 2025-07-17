import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminToken(request);
    const { id } = await context.params;

    // Check if diet plan exists
    const dietPlan = await prisma.dietPlan.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!dietPlan) {
      return NextResponse.json(
        { success: false, error: 'Diet plan not found' },
        { status: 404 }
      );
    }

    // Check if plan is enrolled by a user
    if (dietPlan.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete diet plan that is enrolled by a user' },
        { status: 403 }
      );
    }

    // Delete diet plan (this will also delete related meals and ingredients due to cascade)
    await prisma.dietPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Diet plan deleted successfully',
    });
  } catch (error) {
    console.error('Admin diet plan deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete diet plan' 
      },
      { status: 500 }
    );
  }
}