import { NextRequest, NextResponse } from 'next/server';
import { phonePeService } from '@/lib/payment/phonepe';
import { prisma } from '@/lib/prisma';

// Handle PhonePe server-to-server callback (webhook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PhonePe callback received:', body);

    // PhonePe sends the response in base64 encoded format
    const { response } = body;

    if (!response) {
      console.log('No response data in PhonePe callback');
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }

    // Decode the response
    let decodedResponse;
    try {
      decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    } catch (decodeError) {
      console.error('Failed to decode PhonePe response:', decodeError);
      return NextResponse.json({ error: 'Invalid response format' }, { status: 400 });
    }

    console.log('Decoded PhonePe response:', decodedResponse);

    const { data } = decodedResponse;

    if (!data || !data.merchantTransactionId) {
      console.log('Invalid transaction data in PhonePe callback');
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }

    // Verify the payment status with PhonePe API to ensure authenticity
    const verificationResponse = await phonePeService.verifyPayment(data.merchantTransactionId);

    if (verificationResponse.success && verificationResponse.data) {
      const paymentData = verificationResponse.data;
      const isPaymentSuccessful = paymentData.state === 'COMPLETED';

      console.log(`Payment ${data.merchantTransactionId} status: ${paymentData.state}`);

      // Update order status in database
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
                status: isPaymentSuccessful ? 'confirmed' : 'cancelled',
                updatedAt: new Date()
              }
            });

            console.log(`Order ${order.id} status updated to:`, isPaymentSuccessful ? 'confirmed' : 'cancelled');

            // Handle successful payment (e.g., send confirmation email, update inventory, etc.)
            if (isPaymentSuccessful) {
              // You can add additional business logic here
              console.log('Payment successful, order confirmed:', order.id);
            }
          } else {
            console.log('No matching pending order found for payment:', paymentData.merchantTransactionId);
          }
        } catch (dbError) {
          console.error('Database error while updating order:', dbError);
        }
      }

      // Respond to PhonePe with success
      return NextResponse.json({
        success: true,
        message: 'Callback processed successfully'
      });

    } else {
      console.log('Payment verification failed for:', data.merchantTransactionId);
      return NextResponse.json({
        success: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('PhonePe callback processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for manual callback processing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantTransactionId = searchParams.get('merchantTransactionId');
  const code = searchParams.get('code');

  console.log('PhonePe GET callback:', { merchantTransactionId, code });

  if (!merchantTransactionId) {
    return NextResponse.redirect(new URL('/payment/failed?error=missing_transaction_id', request.url));
  }

  try {
    // Verify the payment
    const verificationResponse = await phonePeService.verifyPayment(merchantTransactionId);

    if (verificationResponse.success && verificationResponse.data?.state === 'COMPLETED') {
      // Payment successful - redirect to success page with transaction details
      const successUrl = new URL('/payment/success', request.url);
      successUrl.searchParams.set('merchantTransactionId', merchantTransactionId);
      successUrl.searchParams.set('transactionId', verificationResponse.data.transactionId);

      return NextResponse.redirect(successUrl);
    } else {
      // Payment failed - redirect to failure page
      const failureUrl = new URL('/payment/failed', request.url);
      failureUrl.searchParams.set('merchantTransactionId', merchantTransactionId);
      failureUrl.searchParams.set('reason', verificationResponse.error || 'Payment verification failed');

      return NextResponse.redirect(failureUrl);
    }

  } catch (error) {
    console.error('PhonePe GET callback error:', error);
    return NextResponse.redirect(new URL('/payment/failed?error=callback_processing_failed', request.url));
  }
}