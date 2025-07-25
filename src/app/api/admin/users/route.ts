import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        age: true,
        height: true,
        weight: true,
        gender: true,
        activityLevel: true,
        createdAt: true,
        updatedAt: true,
        dietPlans: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        goals: {
          select: {
            id: true,
            type: true,
            target: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Admin authentication failed')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Server error for all other cases
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}