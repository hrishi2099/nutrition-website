import { NextRequest, NextResponse } from 'next/server';
import { phonePeService } from '@/lib/payment/phonepe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantTransactionId } = body;

    if (!merchantTransactionId) {
      return NextResponse.json(
        { error: 'Missing merchantTransactionId' },
        { status: 400 }
      );
    }

    // Verify payment with PhonePe
    const verificationResponse = await phonePeService.verifyPayment(merchantTransactionId);

    if (!verificationResponse.success) {
      return NextResponse.json({
        success: false,
        error: verificationResponse.error || 'Payment verification failed'
      });
    }

    const paymentData = verificationResponse.data!;
    const isPaymentSuccessful = paymentData.state === 'COMPLETED';

    // Update order status in database if payment is successful
    if (isPaymentSuccessful && paymentData.merchantTransactionId.includes('NUTRISAP')) {
      try {
        // Find the related order and update its status
        const orders = await prisma.order.findMany({
          where: {
            totalAmount: phonePeService.convertFromPhonePeAmount(paymentData.amount),
            status: 'pending'
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        });

        if (orders.length > 0) {
          const order = orders[0];
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'confirmed',
              updatedAt: new Date()
            }
          });

          console.log('Order status updated to confirmed:', order.id);
        }
      } catch (dbError) {
        console.error('Database error while updating order:', dbError);
        // Continue with response even if DB operation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantTransactionId: paymentData.merchantTransactionId,
        transactionId: paymentData.transactionId,
        status: paymentData.state,
        amount: phonePeService.convertFromPhonePeAmount(paymentData.amount),
        paymentInstrument: paymentData.paymentInstrument,
        responseCode: paymentData.responseCode,
        isPaymentSuccessful
      }
    });

  } catch (error) {
    console.error('PhonePe payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle PhonePe callback (webhook)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantTransactionId = searchParams.get('merchantTransactionId');

    if (!merchantTransactionId) {
      return NextResponse.json(
        { error: 'Missing merchantTransactionId' },
        { status: 400 }
      );
    }

    // Verify the payment
    const verificationResponse = await phonePeService.verifyPayment(merchantTransactionId);

    if (verificationResponse.success && verificationResponse.data?.state === 'COMPLETED') {
      // Payment successful - redirect to success page
      return NextResponse.redirect(new URL('/payment/success', request.url));
    } else {
      // Payment failed - redirect to failure page
      return NextResponse.redirect(new URL('/payment/failed', request.url));
    }

  } catch (error) {
    console.error('PhonePe callback error:', error);
    return NextResponse.redirect(new URL('/payment/failed', request.url));
  }
}