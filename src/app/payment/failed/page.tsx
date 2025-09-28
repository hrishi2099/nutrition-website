'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { usePayment } from '@/contexts/PaymentContext';
import { formatPrice } from '@/utils/currency';
import { XCircle, RefreshCw, ArrowLeft, Home, HelpCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  const { paymentData, selectedGateway } = usePayment();

  const commonIssues = [
    'Insufficient funds in your account',
    'Card expired or blocked',
    'Network connectivity issues',
    'Incorrect payment details',
    'Bank server temporarily unavailable',
    'Payment limit exceeded'
  ];

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
                className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-16 h-16 text-red-600" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Failed
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  We couldn&apos;t process your payment. Please try again.
                </p>
                {paymentData && (
                  <p className="text-sm text-gray-500">
                    Order ID: <span className="font-medium text-gray-900">{paymentData.orderId}</span>
                  </p>
                )}
              </motion.div>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Details */}
            {paymentData && (
              <FadeInSection delay={0.2}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-6">
                    <RefreshCw className="text-orange-600 mr-3" size={24} />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Payment Details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(paymentData.amount)}
                      </span>
                    </div>

                    {selectedGateway && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="capitalize text-gray-900 font-medium">
                          {selectedGateway}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer</span>
                      <span className="text-gray-900">{paymentData.customerName}</span>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium text-gray-900 mb-3">Items</h3>
                      <div className="space-y-2">
                        {(paymentData.items as unknown as { product: { name: string; price: number }; quantity: number }[]).map((item, index: number) => (
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
            )}

            {/* Troubleshooting */}
            <FadeInSection delay={0.3}>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <HelpCircle className="text-blue-600 mr-3" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Common Issues
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-gray-600 text-sm">
                    Your payment might have failed due to one of these reasons:
                  </p>

                  <ul className="space-y-2">
                    {commonIssues.map((issue, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-600">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    If you continue to face issues, please contact our support team.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-700">
                      <strong>Email:</strong> support@nutritionwebsite.com
                    </p>
                    <p className="text-blue-700">
                      <strong>Phone:</strong> +91-1234567890
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* Action Buttons */}
          <FadeInSection delay={0.4}>
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/checkout">
                    <AnimatedButton className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <span className="flex items-center justify-center">
                        <RefreshCw className="mr-2" size={16} />
                        Try Again
                      </span>
                    </AnimatedButton>
                  </Link>

                  <Link href="/cart">
                    <AnimatedButton variant="secondary" className="w-full">
                      <span className="flex items-center justify-center">
                        <ArrowLeft className="mr-2" size={16} />
                        Back to Cart
                      </span>
                    </AnimatedButton>
                  </Link>
                </div>

                <Link href="/">
                  <AnimatedButton variant="outline" className="w-full">
                    <span className="flex items-center justify-center">
                      <Home className="mr-2" size={16} />
                      Continue Shopping
                    </span>
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </PageTransition>
  );
}