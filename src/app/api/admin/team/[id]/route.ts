import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teamMember = await prisma.teamMember.findUnique({
      where: { id }
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, position, bio, avatar, email, linkedIn, twitter, specialties, displayOrder, isActive } = await request.json();

    if (!name || !position || !bio) {
      return NextResponse.json(
        { error: 'Name, position, and bio are required' },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.update({
      where: { id },
      data: {
        name,
        position,
        bio,
        avatar: avatar || null,
        email: email || null,
        linkedIn: linkedIn || null,
        twitter: twitter || null,
        specialties: specialties || [],
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.teamMember.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}