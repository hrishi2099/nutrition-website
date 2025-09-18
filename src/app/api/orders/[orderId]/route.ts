import { NextRequest, NextResponse } from 'next/server';
import orderService from '@/lib/orders/orderService';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = orderService.getOrder(params.orderId);

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
  { params }: { params: { orderId: string } }
) {
  try {
    const updates = await request.json();
    let order = orderService.getOrder(params.orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    if (updates.status) {
      order = orderService.updateOrderStatus(params.orderId, updates.status);
    }

    // Update payment status
    if (updates.paymentStatus) {
      order = orderService.updatePaymentStatus(
        params.orderId,
        updates.paymentStatus,
        updates.paymentId
      );
    }

    // Add tracking number
    if (updates.trackingNumber) {
      order = orderService.addTrackingNumber(params.orderId, updates.trackingNumber);
    }

    // Add notes
    if (updates.notes) {
      order = orderService.addOrderNotes(params.orderId, updates.notes);
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
  { params }: { params: { orderId: string } }
) {
  try {
    const success = orderService.deleteOrder(params.orderId);

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