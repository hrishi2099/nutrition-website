import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function verifyAdminToken(request: NextRequest) {
  console.log('Verifying admin token...');
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      console.log('No token provided');
      throw new Error('No token provided');
    }

    console.log('Token found:', token);

    const { payload } = await verifyJWT(token);
    const userId = payload.userId as string;

    if (!userId) {
      console.log('Invalid token: no userId');
      throw new Error('Invalid token');
    }

    console.log('User ID from token:', userId);

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
      console.log('User not found for ID:', userId);
      throw new Error('User not found');
    }

    console.log('User found:', user);

    if (user.role !== 'ADMIN') {
      console.log('User is not an admin:', user.role);
      throw new Error('Insufficient permissions');
    }

    console.log('Admin user verified:', user);
    return user;
  } catch (error) {
    console.error('Admin authentication error:', error);
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