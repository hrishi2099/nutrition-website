import { NextRequest, NextResponse } from 'next/server';
import pdfService from '@/lib/pdf/pdfService';

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would verify admin permissions here
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let purchases;

    if (userId) {
      purchases = pdfService.getUserPurchases(userId);
    } else {
      purchases = pdfService.getAllPurchases();
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      purchases = purchases.filter(purchase => purchase.status === status);
    }

    return NextResponse.json({
      success: true,
      purchases,
      total: purchases.length,
    });

  } catch (error) {
    console.error('Error fetching PDF purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF purchases' },
      { status: 500 }
    );
  }
}

// Admin actions on PDF purchases
export async function PATCH(request: NextRequest) {
  try {
    const { action, purchaseId, data } = await request.json();

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    let result = false;

    switch (action) {
      case 'revoke':
        result = pdfService.revokePurchase(purchaseId);
        break;

      case 'extend':
        const { additionalDays } = data || {};
        if (!additionalDays || additionalDays <= 0) {
          return NextResponse.json(
            { error: 'Valid additionalDays is required for extend action' },
            { status: 400 }
          );
        }
        result = pdfService.extendPurchase(purchaseId, additionalDays);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Purchase not found or action failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Purchase ${action} successful`,
    });

  } catch (error) {
    console.error('Error managing PDF purchase:', error);
    return NextResponse.json(
      { error: 'Failed to manage PDF purchase' },
      { status: 500 }
    );
  }
}