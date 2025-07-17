import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

export async function verifyAdminToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      throw new Error('No token provided');
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      throw new Error('Invalid token');
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new Error('Insufficient permissions');
    }

    return user;
  } catch {
    throw new Error('Admin authentication failed');
  }
}

export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    await verifyAdminToken(request);
    return true;
  } catch {
    return false;
  }
}