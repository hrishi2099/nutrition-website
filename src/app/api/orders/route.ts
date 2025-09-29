import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    // Verify authentication if userId is provided
    if (userId) {
      try {
        const cookieHeader = request.headers.get('cookie');
        if (!cookieHeader) {
          return NextResponse.json({ success: true, orders: [] });
        }

        // Extract token from cookie header
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        if (!tokenMatch) {
          return NextResponse.json({ success: true, orders: [] });
        }

        const token = tokenMatch[1];
        const { payload } = await verifyJWT(token);

        // Only allow users to see their own orders
        if (payload.userId !== userId) {
          return NextResponse.json({ success: true, orders: [] });
        }
      } catch (authError) {
        console.log('Auth verification failed:', authError);
        return NextResponse.json({ success: true, orders: [] });
      }
    }

    let orders;

    if (userId) {
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      orders = await prisma.order.findMany({
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Transform to match the expected format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderId: `ORD-${order.id.slice(-8).toUpperCase()}`,
      userId: order.userId,
      status: order.status,
      paymentStatus: 'completed', // Assume completed if order exists
      paymentGateway: 'razorpay', // Default gateway
      amount: order.totalAmount,
      currency: 'INR',
      customer: {
        name: 'Customer', // You may want to get this from user table
        email: 'customer@example.com', // You may want to get this from user table
        phone: '+91 9999999999'
      },
      shippingAddress: {
        street: 'Address Line 1',
        city: 'City',
        state: 'State',
        postalCode: '000000',
        country: 'India'
      },
      items: order.orderItems.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.imageUrl
        },
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
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
    const requiredFields = ['userId', 'totalAmount', 'items'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: orderData.userId,
        totalAmount: orderData.totalAmount,
        status: orderData.status || 'pending',
        orderItems: {
          create: orderData.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

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