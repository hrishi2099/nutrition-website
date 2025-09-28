import { NextRequest, NextResponse } from 'next/server';
import pdfService from '@/lib/pdf/pdfService';
import emailService from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      productId,
      orderId,
      product,
      customerEmail,
      customerName
    } = await request.json();

    // Validate required fields
    if (!userId || !productId || !orderId || !product || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate product type
    if (product.type !== 'pdf') {
      return NextResponse.json(
        { error: 'Product is not a PDF type' },
        { status: 400 }
      );
    }

    // Create PDF purchase record
    const purchase = pdfService.createPurchase(userId, productId, orderId, product);

    // Send email with download link
    const emailResult = await emailService.sendPdfPurchaseEmail(
      purchase,
      product,
      customerEmail,
      customerName
    );

    if (emailResult.success) {
      // Mark email as sent
      pdfService.markEmailSent(purchase.id);

      return NextResponse.json({
        success: true,
        purchase: {
          id: purchase.id,
          downloadLink: purchase.downloadLink,
          maxDownloads: purchase.maxDownloads,
          expiryDate: purchase.expiryDate,
          emailSent: true,
        },
        message: 'PDF purchase created and email sent successfully'
      });
    } else {
      // Email failed, but purchase is still valid
      return NextResponse.json({
        success: true,
        purchase: {
          id: purchase.id,
          downloadLink: purchase.downloadLink,
          maxDownloads: purchase.maxDownloads,
          expiryDate: purchase.expiryDate,
          emailSent: false,
        },
        warning: 'PDF purchase created but email delivery failed',
        emailError: emailResult.error
      });
    }

  } catch (error) {
    console.error('PDF purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF purchase' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const purchases = pdfService.getUserPurchases(userId);

    return NextResponse.json({
      success: true,
      purchases
    });

  } catch (error) {
    console.error('Error fetching PDF purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF purchases' },
      { status: 500 }
    );
  }
}