import { NextRequest, NextResponse } from 'next/server';
import { paymentConfig } from '@/lib/payment/config';

export async function POST(request: NextRequest) {
  try {
    if (!paymentConfig.razorpay.enabled) {
      return NextResponse.json(
        { error: 'Razorpay is not configured' },
        { status: 400 }
      );
    }

    const { amount, currency, orderId, customerName, customerEmail, customerPhone } = await request.json();

    // Validate required fields
    if (!amount || !currency || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, you would use the actual Razorpay SDK
    // For demo purposes, we'll simulate the order creation
    const order = {
      id: `rzp_order_${orderId}`,
      amount: amount,
      currency: currency,
      status: 'created',
      key_id: paymentConfig.razorpay.keyId,
    };

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}