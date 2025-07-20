import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contactInfo = await prisma.contactInfo.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no contact info found, return default values
    if (!contactInfo) {
      const defaultContactInfo = {
        companyName: 'NutriSap',
        email: 'info@nutrisap.com',
        supportEmail: 'support@nutrisap.com',
        phone: '+1 (555) 123-4567',
        phoneHours: 'Mon-Fri: 8AM-6PM EST',
        address: '123 Wellness Street',
        city: 'Health City',
        state: 'HC',
        zipCode: '12345',
        mondayFridayHours: '8:00 AM - 6:00 PM',
        saturdayHours: '9:00 AM - 4:00 PM',
        sundayHours: 'Closed',
      };

      return NextResponse.json({
        success: true,
        contactInfo: defaultContactInfo,
      });
    }

    return NextResponse.json({
      success: true,
      contactInfo,
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    
    // Return default contact info in case of database error
    const defaultContactInfo = {
      companyName: 'NutriSap',
      email: 'info@nutrisap.com',
      supportEmail: 'support@nutrisap.com',
      phone: '+1 (555) 123-4567',
      phoneHours: 'Mon-Fri: 8AM-6PM EST',
      address: '123 Wellness Street',
      city: 'Health City',
      state: 'HC',
      zipCode: '12345',
      mondayFridayHours: '8:00 AM - 6:00 PM',
      saturdayHours: '9:00 AM - 4:00 PM',
      sundayHours: 'Closed',
    };

    return NextResponse.json({
      success: true,
      contactInfo: defaultContactInfo,
    });
  }
}