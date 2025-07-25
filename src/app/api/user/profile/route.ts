import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    throw new Error('No token provided');
  }

  const { payload } = await verifyJWT(token);
  const userId = payload.userId as string;

  if (!userId) {
    throw new Error('Invalid token');
  }

  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        height: true,
        weight: true,
        gender: true,
        activityLevel: true,
        createdAt: true,
        updatedAt: true,
        goals: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            target: true,
            deadline: true,
            createdAt: true,
          },
        },
        dietPlans: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            duration: true,
            calories: true,
            mealsPerDay: true,
            price: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    const body = await request.json();

    const {
      firstName,
      lastName,
      age,
      height,
      weight,
      gender,
      activityLevel,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (age && (age < 1 || age > 120)) {
      return NextResponse.json(
        { error: 'Age must be between 1 and 120' },
        { status: 400 }
      );
    }

    if (height && (height < 50 || height > 300)) {
      return NextResponse.json(
        { error: 'Height must be between 50 and 300 cm' },
        { status: 400 }
      );
    }

    if (weight && (weight < 20 || weight > 500)) {
      return NextResponse.json(
        { error: 'Weight must be between 20 and 500 kg' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        gender: gender || null,
        activityLevel: activityLevel || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        height: true,
        weight: true,
        gender: true,
        activityLevel: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}