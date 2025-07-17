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
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users' 
      },
      { status: 401 }
    );
  }
}