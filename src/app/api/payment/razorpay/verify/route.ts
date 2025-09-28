import { NextRequest, NextResponse } from 'next/server';
import { paymentConfig } from '@/lib/payment/config';
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    if (!paymentConfig.razorpay.enabled) {
      return NextResponse.json(
        { error: 'Razorpay is not configured' },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Verify the signature using crypto
    const expectedSignature = createHmac('sha256', paymentConfig.razorpay.keySecret || 'demo_secret')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update order status in the database
    try {
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/${razorpay_order_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: 'completed',
          status: 'confirmed',
          paymentId: razorpay_payment_id,
        }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }

    // Here you would typically also:
    // 1. Send confirmation email
    // 2. Update inventory
    // 3. Create invoice
    // 4. Trigger webhooks/notifications

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}