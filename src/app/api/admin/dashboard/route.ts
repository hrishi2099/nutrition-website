import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request);

    // Get basic statistics
    const [
      totalUsers,
      totalDietPlans,
      totalMeals,
      activeEnrollments,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentUsers,
      recentEnrollments,
      recentOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.dietPlan.count(),
      prisma.meal.count(),
      prisma.dietPlan.count({
        where: { userId: { not: null } }
      }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.dietPlan.findMany({
        where: { userId: { not: null } },
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.order.findMany({
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    ]);

    const stats = {
      totalUsers,
      totalDietPlans,
      totalMeals,
      activeEnrollments,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentUsers,
      recentEnrollments: recentEnrollments.map(enrollment => ({
        id: enrollment.id,
        user: enrollment.user,
        dietPlan: {
          name: enrollment.name,
          price: enrollment.price,
        },
        createdAt: enrollment.createdAt,
      })),
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customer: order.user,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' 
      },
      { status: 401 }
    );
  }
}