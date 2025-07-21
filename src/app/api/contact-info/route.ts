import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Define default contact info with environment variable fallbacks
  const defaultContactInfo = {
    companyName: process.env.COMPANY_NAME || 'NutriSap',
    email: process.env.COMPANY_EMAIL || 'info@nutrisap.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@nutrisap.com',
    phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
    phoneHours: process.env.PHONE_HOURS || 'Mon-Fri: 8AM-6PM EST',
    address: process.env.COMPANY_ADDRESS || '123 Wellness Street',
    city: process.env.COMPANY_CITY || 'Health City',
    state: process.env.COMPANY_STATE || 'HC',
    zipCode: process.env.COMPANY_ZIP_CODE || '12345',
    mondayFridayHours: process.env.MONDAY_FRIDAY_HOURS || '8:00 AM - 6:00 PM',
    saturdayHours: process.env.SATURDAY_HOURS || '9:00 AM - 4:00 PM',
    sundayHours: process.env.SUNDAY_HOURS || 'Closed',
    facebookUrl: process.env.FACEBOOK_URL || null,
    twitterUrl: process.env.TWITTER_URL || null,
    instagramUrl: process.env.INSTAGRAM_URL || null,
    linkedinUrl: process.env.LINKEDIN_URL || null,
  };

  try {
    const contactInfo = await prisma.contactInfo.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return database info if found, otherwise return defaults from env vars
    return NextResponse.json({
      success: true,
      contactInfo: contactInfo || defaultContactInfo,
    });
  } catch (error) {
    console.error('Error fetching contact info (using environment fallback):', error);
    
    // Return environment-based contact info in case of database error
    return NextResponse.json({
      success: true,
      contactInfo: defaultContactInfo,
    });
  }
}