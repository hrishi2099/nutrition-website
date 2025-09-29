'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnimatedButton from '@/components/AnimatedButton';

function PhonePeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const merchantTransactionId = searchParams.get('merchantTransactionId');
        const code = searchParams.get('code');

        if (!merchantTransactionId) {
          setStatus('failed');
          setError('Missing transaction ID');
          return;
        }

        // Get pending payment data from session storage
        const pendingPayment = sessionStorage.getItem('pending-payment');
        let paymentData = null;

        if (pendingPayment) {
          paymentData = JSON.parse(pendingPayment);
        }

        // Verify payment with backend
        const verifyResponse = await fetch('/api/payment/phonepe/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ merchantTransactionId }),
        });

        const verifyResult = await verifyResponse.json();

        if (verifyResult.success && verifyResult.data.isPaymentSuccessful) {
          setStatus('success');
          setTransactionDetails(verifyResult.data);

          // Clear pending payment data
          sessionStorage.removeItem('pending-payment');

          // Clear cart
          localStorage.removeItem('nutrition-cart');

          // Process PDF purchases if any
          if (paymentData && paymentData.items) {
            const pdfItems = paymentData.items.filter((item: any) => item.product.type === 'pdf');
            if (pdfItems.length > 0) {
              for (const item of pdfItems) {
                try {
                  await fetch('/api/pdf/purchase', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      userId: 'demo-user-id', // Replace with actual user ID
                      productId: item.product.id,
                      orderId: paymentData.orderId,
                      product: item.product,
                      customerEmail: 'customer@example.com', // Replace with actual email
                      customerName: 'Customer Name', // Replace with actual name
                    }),
                  });
                } catch (pdfError) {
                  console.error('Error processing PDF purchase:', pdfError);
                }
              }
            }
          }

          // Redirect to success page after a delay
          setTimeout(() => {
            router.push('/payment/success');
          }, 3000);

        } else {
          setStatus('failed');
          setError(verifyResult.error || 'Payment verification failed');

          // Redirect to failure page after a delay
          setTimeout(() => {
            router.push('/payment/failed');
          }, 3000);
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setError('Payment verification failed');

        setTimeout(() => {
          router.push('/payment/failed');
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: Clock,
          title: 'Verifying Payment',
          description: 'Please wait while we verify your payment with PhonePe...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        };
      case 'success':
        return {
          icon: CheckCircle,
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully.',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        };
      case 'failed':
        return {
          icon: XCircle,
          title: 'Payment Failed',
          description: error || 'There was an issue processing your payment.',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        };
      case 'pending':
        return {
          icon: AlertCircle,
          title: 'Payment Pending',
          description: 'Your payment is being processed. Please wait...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        };
      default:
        return {
          icon: Clock,
          title: 'Processing',
          description: 'Please wait...',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
        };
    }
  };

  const statusContent = getStatusContent();
  const Icon = statusContent.icon;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${statusContent.bgColor} mb-6`}>
            {status === 'loading' ? (
              <LoadingSpinner />
            ) : (
              <Icon className={`h-10 w-10 ${statusContent.color}`} />
            )}
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {statusContent.title}
          </h2>

          <p className="text-lg text-gray-600 mb-8">
            {statusContent.description}
          </p>

          {transactionDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg p-6 shadow-sm border mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-gray-900">{transactionDetails.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">₹{transactionDetails.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">{transactionDetails.status}</span>
                </div>
                {transactionDetails.paymentInstrument && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-900">{transactionDetails.paymentInstrument.type}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {status !== 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <AnimatedButton
                onClick={() => router.push('/')}
                className="w-full"
              >
                Return to Home
              </AnimatedButton>

              {status === 'success' && (
                <AnimatedButton
                  onClick={() => router.push('/profile/orders')}
                  variant="outline"
                  className="w-full"
                >
                  View Orders
                </AnimatedButton>
              )}

              {status === 'failed' && (
                <AnimatedButton
                  onClick={() => router.push('/cart')}
                  variant="outline"
                  className="w-full"
                >
                  Return to Cart
                </AnimatedButton>
              )}
            </motion.div>
          )}

          {status === 'loading' && (
            <p className="text-sm text-gray-500">
              This may take a few moments. Please do not close this page.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function PhonePeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <PhonePeCallbackContent />
    </Suspense>
  );
}