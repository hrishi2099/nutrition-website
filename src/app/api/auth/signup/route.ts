import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { validateEmail, validatePassword, validateName, combineValidationResults } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Comprehensive input validation
    const firstNameValidation = validateName(firstName, 'First name');
    const lastNameValidation = validateName(lastName, 'Last name');
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    
    const combinedValidation = combineValidationResults(
      firstNameValidation,
      lastNameValidation,
      emailValidation,
      passwordValidation
    );
    
    if (!combinedValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: combinedValidation.errors
        },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      firstName,
      lastName,
      email,
      password,
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}