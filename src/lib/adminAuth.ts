import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function verifyAdminToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      throw new Error('No token provided');
    }

    const { payload } = await verifyJWT(token);
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