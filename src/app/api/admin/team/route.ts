import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMembers = await prisma.teamMember.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, position, bio, avatar, email, linkedIn, twitter, specialties, displayOrder } = await request.json();

    if (!name || !position || !bio) {
      return NextResponse.json(
        { error: 'Name, position, and bio are required' },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        position,
        bio,
        avatar: avatar || null,
        email: email || null,
        linkedIn: linkedIn || null,
        twitter: twitter || null,
        specialties: specialties || [],
        displayOrder: displayOrder || 0
      }
    });

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}