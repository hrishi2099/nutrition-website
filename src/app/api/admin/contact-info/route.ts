import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contactInfo = await prisma.contactInfo.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      contactInfo,
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyName,
      email,
      supportEmail,
      phone,
      phoneHours,
      address,
      city,
      state,
      zipCode,
      mondayFridayHours,
      saturdayHours,
      sundayHours,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
    } = body;

    if (!email || !phone || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Check if contact info already exists
    const existingInfo = await prisma.contactInfo.findFirst();

    let contactInfo;
    if (existingInfo) {
      // Update existing record
      contactInfo = await prisma.contactInfo.update({
        where: { id: existingInfo.id },
        data: {
          companyName,
          email,
          supportEmail,
          phone,
          phoneHours,
          address,
          city,
          state,
          zipCode,
          mondayFridayHours,
          saturdayHours,
          sundayHours,
          facebookUrl,
          twitterUrl,
          instagramUrl,
          linkedinUrl,
        },
      });
    } else {
      // Create new record
      contactInfo = await prisma.contactInfo.create({
        data: {
          companyName,
          email,
          supportEmail,
          phone,
          phoneHours,
          address,
          city,
          state,
          zipCode,
          mondayFridayHours,
          saturdayHours,
          sundayHours,
          facebookUrl,
          twitterUrl,
          instagramUrl,
          linkedinUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      contactInfo,
    });
  } catch (error) {
    console.error('Error saving contact info:', error);
    return NextResponse.json(
      { error: 'Failed to save contact info' },
      { status: 500 }
    );
  }
}