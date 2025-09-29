import { NextRequest, NextResponse } from 'next/server';
import { phonePeService } from '@/lib/payment/phonepe';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieHeader = request.headers.get('cookie');
    let userId = null;

    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (tokenMatch) {
        try {
          const { payload } = await verifyJWT(tokenMatch[1]);
          userId = payload.userId;
        } catch (authError) {
          console.log('Auth verification failed for PhonePe payment:', authError);
        }
      }
    }

    const body = await request.json();
    const {
      amount,
      orderId,
      customerPhone,
      customerName,
      customerEmail
    } = body;

    // Validate required fields
    if (!amount || !orderId || !customerPhone || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId, customerPhone, customerName, customerEmail' },
        { status: 400 }
      );
    }

    // Validate amount
    if (!phonePeService.isValidAmount(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between ₹1 and ₹1,00,000' },
        { status: 400 }
      );
    }

    // Generate unique merchant transaction ID
    const merchantTransactionId = phonePeService.generateMerchantTransactionId('NUTRISAP');

    // Create payment request
    const paymentRequest = {
      merchantTransactionId,
      amount: amount, // Amount should already be in paise
      userId: typeof userId === 'string' ? userId : undefined,
      customerEmail,
      customerPhone,
      customerName,
      orderId
    };

    // Create payment with PhonePe
    const paymentResponse = await phonePeService.createPayment(paymentRequest);

    if (!paymentResponse.success) {
      return NextResponse.json(
        { error: paymentResponse.error || 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Store payment details in database (optional)
    try {
      if (typeof userId === 'string') {
        // Create order record if user is authenticated
        const order = await prisma.order.create({
          data: {
            userId,
            totalAmount: phonePeService.convertFromPhonePeAmount(amount),
            status: 'pending',
            // You can add more fields as needed
          }
        });

        console.log('Order created for PhonePe payment:', order.id);
      }
    } catch (dbError) {
      console.error('Database error while creating order:', dbError);
      // Continue with payment even if DB operation fails
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantTransactionId,
        transactionId: paymentResponse.data?.transactionId,
        redirectUrl: paymentResponse.redirectUrl,
        amount: phonePeService.convertFromPhonePeAmount(amount),
        orderId
      }
    });

  } catch (error) {
    console.error('PhonePe payment initiation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}