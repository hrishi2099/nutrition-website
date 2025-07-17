import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const hashedPassword = await hashPassword(userData.password);
  
  return prisma.user.create({
    data: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
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
    },
  });
}