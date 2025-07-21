import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/adminAuth';

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
    // First verify admin authentication
    const user = await verifyAdminToken(request);
    console.log('Admin user attempting to update contact info:', user.email);

    const body = await request.json();
    console.log('Contact info update request:', body);

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

    // Check database connection
    console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);

    // Check if contact info already exists
    const existingInfo = await prisma.contactInfo.findFirst();
    console.log('Existing contact info found:', !!existingInfo);

    let contactInfo;
    if (existingInfo) {
      // Update existing record
      console.log('Updating existing contact info record');
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
      console.log('Creating new contact info record');
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

    console.log('Contact info saved successfully:', contactInfo.id);

    return NextResponse.json({
      success: true,
      contactInfo,
    });
  } catch (error) {
    console.error('Error saving contact info:', error);
    return NextResponse.json(
      { error: 'Failed to save contact info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}