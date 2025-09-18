import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    enrollments: [],
    message: 'Test endpoint working - no enrollments available'
  });
}