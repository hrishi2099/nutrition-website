import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminToken(request);
    
    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Admin verification failed' 
      },
      { status: 401 }
    );
  }
}