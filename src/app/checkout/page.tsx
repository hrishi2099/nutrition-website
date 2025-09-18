'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useToast } from '@/contexts/ToastContext';
import { ShippingAddress, PaymentMethod } from '@/types/product';
import { formatPrice } from '@/utils/currency';
import Image from 'next/image';
import PaymentGatewaySelector from '@/components/PaymentGatewaySelector';
import { CreditCard, MapPin, User, Lock, ArrowLeft, Shield } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { selectedGateway, setPaymentData, paymentStatus, setPaymentStatus } = usePayment();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (cart.items.length === 0) {
      router.push('/products');
      return;
    }
  }, [isAuthenticated, cart.items.length, router]);


  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGateway) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    setCurrentStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!selectedGateway) {
      showToast('Please select a payment method', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Generate order ID
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare payment data
      const paymentData = {
        orderId,
        amount: cart.finalTotal,
        currency: 'INR',
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: shippingAddress.email,
        customerPhone: shippingAddress.phone,
        shippingAddress,
        items: cart.items,
      };

      setPaymentData(paymentData);

      // Process payment based on selected gateway
      await processPayment(selectedGateway, paymentData);

    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      showToast('Payment failed. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  const processPayment = async (gateway: string, paymentData: any) => {
    try {
      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentData.orderId,
          paymentGateway: gateway,
          amount: paymentData.amount,
          currency: paymentData.currency,
          customer: {
            name: paymentData.customerName,
            email: paymentData.customerEmail,
            phone: paymentData.customerPhone,
          },
          shippingAddress: paymentData.shippingAddress,
          items: paymentData.items.map((item: any) => ({
            productId: item.product.id,
            product: {
              name: item.product.name,
              price: item.product.price,
              image: item.product.image,
              category: item.product.category,
            },
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity,
          })),
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const { order } = await orderResponse.json();

      switch (gateway) {
        case 'razorpay':
          return await processRazorpayPayment(paymentData, order);
        default:
          return await processGenericPayment(paymentData, order);
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      throw error;
    }
  };

  const processGenericPayment = async (paymentData: any, order: any) => {
    try {
      // For demo purposes, simulate successful payment for other gateways
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status to completed
      await fetch(`/api/orders/${order.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: 'completed',
          status: 'confirmed',
          paymentId: `pay_${Date.now()}`,
        }),
      });

      setPaymentStatus('success');
      setOrderComplete(true);
      clearCart();
      showToast('Payment successful!', 'success');
      setIsProcessing(false);

      router.push('/payment/success');
    } catch (error) {
      throw error;
    }
  };

  const processRazorpayPayment = async (paymentData: any, order: any) => {
    try {
      // For demo purposes, simulate Razorpay payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status to completed
      await fetch(`/api/orders/${order.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: 'completed',
          status: 'confirmed',
          paymentId: `rzp_${Date.now()}`,
        }),
      });

      setPaymentStatus('success');
      setOrderComplete(true);
      clearCart();
      showToast('Payment successful with Razorpay!', 'success');
      setIsProcessing(false);

      router.push('/payment/success');
    } catch (error) {
      // Update order status to failed
      await fetch(`/api/orders/${order.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: 'failed',
          status: 'cancelled',
        }),
      });

      router.push('/payment/failed');
      throw error;
    }
  };

  const steps = [
    { number: 1, title: 'Shipping', description: 'Delivery information' },
    { number: 2, title: 'Payment', description: 'Payment method' },
    { number: 3, title: 'Review', description: 'Order summary' },
  ];

  if (orderComplete) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. You will receive a confirmation email shortly.
            </p>
            
            <div className="space-y-3">
              <AnimatedButton
                onClick={() => router.push('/products')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Continue Shopping
              </AnimatedButton>
              <AnimatedButton
                onClick={() => router.push('/profile')}
                variant="secondary"
                className="w-full"
              >
                View Orders
              </AnimatedButton>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (cart.items.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 mb-6">
              Add some products to get started
            </p>
            <AnimatedButton onClick={() => router.push('/products')}>
              Continue Shopping
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Checkout
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep} of 3
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      currentStep >= step.number
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600 '
                    }`}>
                      {step.number}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium ${
                        currentStep >= step.number
                          ? 'text-green-600 '
                          : 'text-gray-500 '
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.description}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                        currentStep > step.number
                          ? 'bg-green-600'
                          : 'bg-gray-200 '
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <FadeInSection>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center mb-6">
                      <MapPin className="text-green-600 mr-3" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Shipping Information
                      </h2>
                    </div>

                    <form onSubmit={handleShippingSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.firstName}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.lastName}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={shippingAddress.email}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress.address}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.zipCode}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country *
                        </label>
                        <select
                          required
                          value={shippingAddress.country}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <AnimatedButton
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                        >
                          Continue to Payment
                        </AnimatedButton>
                      </div>
                    </form>
                  </div>
                </FadeInSection>
              )}

              {currentStep === 2 && (
                <FadeInSection>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center mb-6">
                      <Shield className="text-green-600 mr-3" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Payment Method
                      </h2>
                    </div>

                    <PaymentGatewaySelector />

                    <form onSubmit={handlePaymentSubmit} className="space-y-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentMethod.cardholderName}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="1234 5678 9012 3456"
                          value={paymentMethod.cardNumber}
                          onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={paymentMethod.expiryDate}
                            onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="123"
                            value={paymentMethod.cvv}
                            onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Lock className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm text-gray-500">
                          Your payment information is secure and encrypted
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <AnimatedButton
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep(1)}
                        >
                          Back to Shipping
                        </AnimatedButton>
                        <AnimatedButton
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                        >
                          Review Order
                        </AnimatedButton>
                      </div>
                    </form>
                  </div>
                </FadeInSection>
              )}

              {currentStep === 3 && (
                <FadeInSection>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center mb-6">
                      <User className="text-green-600 mr-3" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Order Review
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {/* Shipping Address */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Shipping Address
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900">
                            {shippingAddress.firstName} {shippingAddress.lastName}
                          </p>
                          <p className="text-gray-600">
                            {shippingAddress.address}
                          </p>
                          <p className="text-gray-600">
                            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                          </p>
                          <p className="text-gray-600">
                            {shippingAddress.country}
                          </p>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Payment Method
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-900">
                            {paymentMethod.cardholderName}
                          </p>
                          <p className="text-gray-600">
                            {paymentMethod.cardNumber ? `**** **** **** ${paymentMethod.cardNumber.slice(-4)}` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <AnimatedButton
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep(2)}
                        >
                          Back to Payment
                        </AnimatedButton>
                        <AnimatedButton
                          onClick={handlePlaceOrder}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : 'Place Order'}
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </FadeInSection>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>

                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => (
                    <div key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 relative">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(cart.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">{formatPrice(cart.tax)}</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(cart.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(cart.finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}


