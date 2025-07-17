import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request);
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '6m';
    
    // Calculate date range
    const now = new Date();
    const monthsBack = range === '1m' ? 1 : range === '3m' ? 3 : range === '6m' ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

    // Get user growth data (currently using mock data)
    // const userGrowth = await prisma.user.groupBy({
    //   by: ['createdAt'],
    //   where: {
    //     createdAt: {
    //       gte: startDate,
    //     },
    //   },
    //   _count: {
    //     id: true,
    //   },
    // });

    // Get plan popularity
    const planPopularity = await prisma.dietPlan.findMany({
      where: {
        userId: { not: null },
        updatedAt: {
          gte: startDate,
        },
      },
      select: {
        name: true,
        price: true,
      },
    });

    // Process plan popularity data
    const planStats = planPopularity.reduce((acc, plan) => {
      if (!acc[plan.name]) {
        acc[plan.name] = { enrollments: 0, revenue: 0 };
      }
      acc[plan.name].enrollments += 1;
      acc[plan.name].revenue += plan.price;
      return acc;
    }, {} as Record<string, { enrollments: number; revenue: number }>);

    const planPopularityArray = Object.entries(planStats).map(([name, stats]) => ({
      name,
      enrollments: stats.enrollments,
      revenue: stats.revenue,
    }));

    // Get demographics
    const genderDistribution = await prisma.user.groupBy({
      by: ['gender'],
      _count: {
        id: true,
      },
    });

    const ageDistribution = await prisma.user.findMany({
      where: {
        age: { not: null },
      },
      select: {
        age: true,
      },
    });

    // Process age distribution
    const ageRanges = ageDistribution.reduce((acc, user) => {
      if (!user.age) return acc;
      
      const range = user.age < 25 ? '18-24' :
                   user.age < 35 ? '25-34' :
                   user.age < 45 ? '35-44' :
                   user.age < 55 ? '45-54' : '55+';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ageDistributionArray = Object.entries(ageRanges).map(([ageRange, count]) => ({
      ageRange,
      count,
    }));

    // Calculate revenue metrics
    const totalRevenue = planPopularityArray.reduce((sum, plan) => sum + plan.revenue, 0);
    const monthlyRevenue = totalRevenue / monthsBack;
    const totalEnrollments = planPopularityArray.reduce((sum, plan) => sum + plan.enrollments, 0);
    const averageOrderValue = totalEnrollments > 0 ? totalRevenue / totalEnrollments : 0;

    // Mock user growth data (in a real app, you'd calculate this from actual data)
    const userGrowthData = [
      { month: 'Jan', users: 45, enrollments: 32 },
      { month: 'Feb', users: 52, enrollments: 38 },
      { month: 'Mar', users: 61, enrollments: 45 },
      { month: 'Apr', users: 58, enrollments: 41 },
      { month: 'May', users: 67, enrollments: 52 },
      { month: 'Jun', users: 73, enrollments: 59 },
    ];

    const analytics = {
      userGrowth: userGrowthData,
      planPopularity: planPopularityArray,
      demographics: {
        genderDistribution: genderDistribution.map(item => ({
          gender: item.gender || 'Not specified',
          count: item._count.id,
        })),
        ageDistribution: ageDistributionArray,
      },
      revenue: {
        totalRevenue,
        monthlyRevenue,
        averageOrderValue,
      },
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics' 
      },
      { status: 401 }
    );
  }
}