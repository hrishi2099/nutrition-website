import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Sample diet plans to use as fallback
const sampleDietPlans = [
  {
    id: 'sample-4',
    name: '7-Day Healthy Eating Kickstart',
    description: 'A one-week introductory plan to help you build healthy eating habits with simple, delicious recipes.',
    type: 'WELLNESS',
    duration: 1,
    calories: 1600,
    mealsPerDay: 3,
    price: 0,
    isActive: true,
    meals: []
  },
  {
    id: 'sample-1',
    name: 'Balanced Weight Loss Plan',
    description: 'A scientifically-designed nutrition plan focused on sustainable weight loss through balanced meals and portion control.',
    type: 'WEIGHT_LOSS',
    duration: 12,
    calories: 1500,
    mealsPerDay: 4,
    price: 7000,
    isActive: true,
    meals: []
  },
  {
    id: 'sample-2',
    name: 'Muscle Building Plan',
    description: 'High-protein nutrition plan designed to support muscle growth and recovery for active individuals.',
    type: 'MUSCLE_GAIN',
    duration: 16,
    calories: 2200,
    mealsPerDay: 5,
    price: 8500,
    isActive: true,
    meals: []
  },
  {
    id: 'sample-3',
    name: 'Wellness Maintenance Plan',
    description: 'A balanced approach to maintaining optimal health with nutrient-dense, whole food meals.',
    type: 'MAINTENANCE',
    duration: 8,
    calories: 1800,
    mealsPerDay: 3,
    price: 5500,
    isActive: true,
    meals: []
  }
];

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

    // If no diet plans found in database, return sample plans
    if (!dietPlans || dietPlans.length === 0) {
      return NextResponse.json({
        success: true,
        dietPlans: sampleDietPlans,
      });
    }

    return NextResponse.json({
      success: true,
      dietPlans,
    });
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    
    // Return sample diet plans in case of database error
    return NextResponse.json({
      success: true,
      dietPlans: sampleDietPlans,
    });
  }
}