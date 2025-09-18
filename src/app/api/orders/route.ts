import { NextRequest, NextResponse } from 'next/server';
import orderService from '@/lib/orders/orderService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    let orders;

    if (search) {
      orders = orderService.searchOrders(search);
    } else if (userId) {
      orders = orderService.getUserOrders(userId);
    } else {
      orders = orderService.getAllOrders();
    }

    return NextResponse.json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Validate required fields
    const requiredFields = ['orderId', 'paymentGateway', 'amount', 'currency', 'customer', 'shippingAddress', 'items'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const order = orderService.createOrder(orderData);

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}