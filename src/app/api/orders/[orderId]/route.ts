import { NextRequest, NextResponse } from 'next/server';
import orderService from '@/lib/orders/orderService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = orderService.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const updates = await request.json();
    let order = orderService.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    if (updates.status) {
      order = orderService.updateOrderStatus(orderId, updates.status);
    }

    // Update payment status
    if (updates.paymentStatus) {
      order = orderService.updatePaymentStatus(
        orderId,
        updates.paymentStatus,
        updates.paymentId
      );
    }

    // Add tracking number
    if (updates.trackingNumber) {
      order = orderService.addTrackingNumber(orderId, updates.trackingNumber);
    }

    // Add notes
    if (updates.notes) {
      order = orderService.addOrderNotes(orderId, updates.notes);
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const success = orderService.deleteOrder(orderId);

    if (!success) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}