import { NextRequest, NextResponse } from 'next/server';
import { signJWT } from '@/lib/jwt';

/**
 * Demo Login API - Works without database
 * Use this for testing when database is not available
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Demo credentials that work without database
    const demoCredentials = [
      { email: 'demo@nutrisap.com', password: 'demo123', role: 'USER' },
      { email: 'admin@nutrisap.com', password: 'admin123', role: 'ADMIN' },
      { email: 'test@nutrisap.com', password: 'test123', role: 'USER' },
    ];

    const user = demoCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid demo credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await signJWT({
      userId: 'demo-user-id',
      email: user.email,
      role: user.role,
    });

    // Set token in cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: 'demo-user-id',
        email: user.email,
        firstName: 'Demo',
        lastName: 'User',
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Demo login failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Demo Login API',
    credentials: [
      { email: 'demo@nutrisap.com', password: 'demo123', role: 'USER' },
      { email: 'admin@nutrisap.com', password: 'admin123', role: 'ADMIN' },
      { email: 'test@nutrisap.com', password: 'test123', role: 'USER' },
    ],
    usage: 'POST to this endpoint with email and password to get demo access',
    note: 'This works without database connection for testing purposes'
  });
}