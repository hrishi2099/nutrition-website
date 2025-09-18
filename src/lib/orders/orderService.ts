import { Order, OrderStatus, PaymentStatus, OrderItem } from '@/types/order';

// In a real application, this would interact with a database
// For demo purposes, we'll use localStorage and in-memory storage

class OrderService {
  private orders: Order[] = [];
  private storageKey = 'nutrition_orders';

  constructor() {
    this.loadOrders();
  }

  private loadOrders() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        try {
          this.orders = JSON.parse(stored).map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
            estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
          }));
        } catch (error) {
          console.error('Error loading orders:', error);
          this.orders = [];
        }
      }
    }
  }

  private saveOrders() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
    }
  }

  createOrder(orderData: {
    orderId: string;
    userId?: string;
    paymentGateway: string;
    amount: number;
    currency: string;
    customer: Order['customer'];
    shippingAddress: Order['shippingAddress'];
    items: OrderItem[];
  }): Order {
    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: orderData.orderId,
      userId: orderData.userId,
      status: 'pending',
      paymentStatus: 'pending',
      paymentGateway: orderData.paymentGateway,
      amount: orderData.amount,
      currency: orderData.currency,
      customer: orderData.customer,
      shippingAddress: orderData.shippingAddress,
      items: orderData.items,
      createdAt: now,
      updatedAt: now,
      estimatedDelivery,
    };

    this.orders.push(order);
    this.saveOrders();
    return order;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();

      // Auto-update payment status based on order status
      if (status === 'confirmed' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'completed';
      } else if (status === 'cancelled') {
        order.paymentStatus = 'cancelled';
      }

      this.saveOrders();
    }
    return order;
  }

  updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus, paymentId?: string): Order | null {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date();

      if (paymentId) {
        order.paymentId = paymentId;
      }

      // Auto-update order status based on payment status
      if (paymentStatus === 'completed' && order.status === 'pending') {
        order.status = 'confirmed';
      } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        order.status = 'cancelled';
      }

      this.saveOrders();
    }
    return order;
  }

  getOrder(orderId: string): Order | null {
    return this.orders.find(o => o.orderId === orderId) || null;
  }

  getOrderById(id: string): Order | null {
    return this.orders.find(o => o.id === id) || null;
  }

  getUserOrders(userId: string): Order[] {
    return this.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getAllOrders(): Order[] {
    return this.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  searchOrders(query: string): Order[] {
    const lowerQuery = query.toLowerCase();
    return this.orders.filter(order =>
      order.orderId.toLowerCase().includes(lowerQuery) ||
      order.customer.name.toLowerCase().includes(lowerQuery) ||
      order.customer.email.toLowerCase().includes(lowerQuery) ||
      order.items.some(item =>
        item.product.name.toLowerCase().includes(lowerQuery)
      )
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getOrderStats(): {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    revenue: number;
  } {
    const stats = {
      total: this.orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      revenue: 0,
    };

    this.orders.forEach(order => {
      stats[order.status as keyof typeof stats] = (stats[order.status as keyof typeof stats] as number) + 1;

      if (order.paymentStatus === 'completed') {
        stats.revenue += order.amount;
      }
    });

    return stats;
  }

  addTrackingNumber(orderId: string, trackingNumber: string): Order | null {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      order.trackingNumber = trackingNumber;
      order.status = 'shipped';
      order.updatedAt = new Date();
      this.saveOrders();
    }
    return order;
  }

  addOrderNotes(orderId: string, notes: string): Order | null {
    const order = this.orders.find(o => o.orderId === orderId);
    if (order) {
      order.notes = notes;
      order.updatedAt = new Date();
      this.saveOrders();
    }
    return order;
  }

  deleteOrder(orderId: string): boolean {
    const index = this.orders.findIndex(o => o.orderId === orderId);
    if (index > -1) {
      this.orders.splice(index, 1);
      this.saveOrders();
      return true;
    }
    return false;
  }
}

// Create a singleton instance
export const orderService = new OrderService();
export default orderService;