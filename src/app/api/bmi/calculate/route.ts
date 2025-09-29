import { NextRequest, NextResponse } from 'next/server';
import { calculateBMI, BMIInput } from '@/utils/bmiCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weight, height, age, gender, activityLevel, useCustomFormula = true } = body;

    // Validate required fields
    if (!weight || !height) {
      return NextResponse.json(
        { error: 'Weight and height are required' },
        { status: 400 }
      );
    }

    // Validate weight and height are positive numbers
    if (weight <= 0 || height <= 0) {
      return NextResponse.json(
        { error: 'Weight and height must be positive numbers' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (age && (age < 1 || age > 120)) {
      return NextResponse.json(
        { error: 'Age must be between 1 and 120 years' },
        { status: 400 }
      );
    }

    if (gender && !['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender must be either "male" or "female"' },
        { status: 400 }
      );
    }

    if (activityLevel && !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activityLevel)) {
      return NextResponse.json(
        { error: 'Invalid activity level' },
        { status: 400 }
      );
    }

    // Create BMI input object
    const bmiInput: BMIInput = {
      weight: parseFloat(weight),
      height: parseFloat(height),
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      activityLevel: activityLevel || undefined
    };

    // Calculate BMI
    const result = calculateBMI(bmiInput, useCustomFormula);

    return NextResponse.json({
      success: true,
      result,
      formula: useCustomFormula ? 'enhanced' : 'standard',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('BMI calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during BMI calculation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'BMI Calculator API',
    description: 'Send a POST request with weight, height, and optional parameters to calculate BMI',
    requiredFields: ['weight', 'height'],
    optionalFields: ['age', 'gender', 'activityLevel', 'useCustomFormula'],
    units: {
      weight: 'kg',
      height: 'cm',
      age: 'years'
    },
    example: {
      weight: 70,
      height: 175,
      age: 30,
      gender: 'male',
      activityLevel: 'moderate',
      useCustomFormula: true
    }
  });
}