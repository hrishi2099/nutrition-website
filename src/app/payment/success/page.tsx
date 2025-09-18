'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { usePayment } from '@/contexts/PaymentContext';
import { formatPrice } from '@/utils/currency';
import { CheckCircle, Package, Mail, ArrowRight, Home } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { paymentData, selectedGateway } = usePayment();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // In a real app, you might fetch order details from an API using order ID
    if (paymentData) {
      setOrderDetails({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        items: paymentData.items,
        estimatedDelivery: getEstimatedDelivery(),
      });
    }
  }, [paymentData]);

  const getEstimatedDelivery = () => {
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days from now
    return deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: "easeInOut" }}
                  className="w-16 h-16 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Successful!
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  Thank you for your order. We&apos;ve received your payment.
                </p>
                {orderDetails && (
                  <p className="text-sm text-gray-500">
                    Order ID: <span className="font-medium text-gray-900">{orderDetails.orderId}</span>
                  </p>
                )}
              </motion.div>
            </div>
          </FadeInSection>

          {orderDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Summary */}
              <FadeInSection delay={0.2}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-6">
                    <Package className="text-green-600 mr-3" size={24} />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Order Summary
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(orderDetails.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="capitalize text-gray-900 font-medium">
                        {selectedGateway}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer</span>
                      <span className="text-gray-900">{orderDetails.customerName}</span>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium text-gray-900 mb-3">Items Ordered</h3>
                      <div className="space-y-2">
                        {orderDetails.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.product.name} x {item.quantity}
                            </span>
                            <span className="text-gray-900">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInSection>

              {/* Next Steps */}
              <FadeInSection delay={0.3}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-6">
                    <Mail className="text-green-600 mr-3" size={24} />
                    <h2 className="text-xl font-semibold text-gray-900">
                      What&apos;s Next?
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Order Confirmation</h3>
                        <p className="text-sm text-gray-600">
                          You&apos;ll receive a confirmation email at {orderDetails.customerEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Processing</h3>
                        <p className="text-sm text-gray-600">
                          We&apos;ll prepare your items for shipment within 24 hours
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Delivery</h3>
                        <p className="text-sm text-gray-600">
                          Estimated delivery: <span className="font-medium">{orderDetails.estimatedDelivery}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <div className="space-y-4">
                      <Link href="/profile">
                        <AnimatedButton className="w-full bg-green-600 hover:bg-green-700 text-white">
                          <span className="flex items-center justify-center">
                            Track Your Order
                            <ArrowRight className="ml-2" size={16} />
                          </span>
                        </AnimatedButton>
                      </Link>

                      <Link href="/">
                        <AnimatedButton variant="secondary" className="w-full">
                          <span className="flex items-center justify-center">
                            <Home className="mr-2" size={16} />
                            Continue Shopping
                          </span>
                        </AnimatedButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            </div>
          )}

          {!orderDetails && (
            <FadeInSection>
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Order details not found
                </h2>
                <p className="text-gray-600 mb-6">
                  It looks like there was an issue retrieving your order information.
                </p>
                <Link href="/">
                  <AnimatedButton>
                    Return to Home
                  </AnimatedButton>
                </Link>
              </div>
            </FadeInSection>
          )}
        </div>
      </div>
    </PageTransition>
  );
}