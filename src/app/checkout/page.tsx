'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useToast } from '@/contexts/ToastContext';
import { ShippingAddress } from '@/types/product';
import Image from 'next/image';
import PaymentGatewaySelector from '@/components/PaymentGatewaySelector';
import { CreditCard, MapPin, Lock, ArrowLeft, Shield } from 'lucide-react';

// Simple price formatter without external dependency
const formatPrice = (price: number): string => {
  return `₹${(price / 100).toFixed(2)}`;
};

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { selectedGateway, setPaymentData, setPaymentStatus } = usePayment();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cart state management without useCart hook to avoid the error
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // Load cart from localStorage to avoid useCart hook issue
    loadCartFromStorage();
  }, [isAuthenticated, router]);

  const loadCartFromStorage = () => {
    try {
      const stored = localStorage.getItem('nutrition-cart');
      if (stored) {
        const cart = JSON.parse(stored);
        setCartItems(cart.items || []);
        setCartTotal(cart.finalTotal || 0);
      } else {
        setCartItems([]);
        setCartTotal(0);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
      setCartTotal(0);
    }
  };

  const clearCart = () => {
    localStorage.removeItem('nutrition-cart');
    setCartItems([]);
    setCartTotal(0);
  };

  // Redirect if no items in cart
  if (cartItems.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to your cart before checkout.</p>
            <AnimatedButton onClick={() => router.push('/products')}>
              Browse Products
            </AnimatedButton>
          </div>
        </div>
      </PageTransition>
    );
  }

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
        amount: cartTotal,
        currency: 'INR',
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: shippingAddress.email,
        customerPhone: shippingAddress.phone,
        shippingAddress,
        items: cartItems,
      };

      setPaymentData(paymentData);

      // Process payment
      await processPayment(selectedGateway, paymentData);

    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      showToast('Payment failed. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  const processPayment = async (gateway: string, paymentData: {
    orderId: string;
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: ShippingAddress;
    items: CartItem[];
  }) => {
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
          items: paymentData.items.map((item: CartItem) => ({
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

      // For demo purposes, simulate successful payment
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
      clearCart();
      showToast('Payment successful!', 'success');
      setIsProcessing(false);

      router.push('/payment/success');
    } catch (error) {
      router.push('/payment/failed');
      throw error;
    }
  };

  const steps = [
    { number: 1, title: 'Shipping', description: 'Delivery information' },
    { number: 2, title: 'Payment', description: 'Payment method' },
    { number: 3, title: 'Review', description: 'Confirm order' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step.number <= currentStep
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p
                      className={`text-sm font-medium ${
                        step.number <= currentStep ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-4 w-16 h-0.5 bg-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <FadeInSection>
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center mb-6">
                      <MapPin className="text-green-600 mr-3" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Shipping Information
                      </h2>
                    </div>

                    <form onSubmit={handleShippingSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.firstName}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={shippingAddress.email}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, email: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={shippingAddress.phone}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.address}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, address: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.city}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, city: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, state: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zip Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.zipCode}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                          </label>
                          <select
                            value={shippingAddress.country}
                            onChange={(e) =>
                              setShippingAddress({ ...shippingAddress, country: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-between">
                        <AnimatedButton
                          type="button"
                          onClick={() => router.push('/cart')}
                          variant="secondary"
                          className="flex items-center"
                        >
                          <ArrowLeft className="mr-2" size={16} />
                          Back to Cart
                        </AnimatedButton>
                        <AnimatedButton type="submit">
                          Continue to Payment
                        </AnimatedButton>
                      </div>
                    </form>
                  </div>
                </FadeInSection>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 2 && (
                <FadeInSection>
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center mb-6">
                      <CreditCard className="text-green-600 mr-3" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Payment Method
                      </h2>
                    </div>

                    <form onSubmit={handlePaymentSubmit}>
                      <PaymentGatewaySelector />

                      <div className="mt-6 flex justify-between">
                        <AnimatedButton
                          type="button"
                          variant="secondary"
                          onClick={() => setCurrentStep(1)}
                        >
                          <ArrowLeft className="mr-2" size={16} />
                          Back to Shipping
                        </AnimatedButton>
                        <AnimatedButton type="submit">
                          Review Order
                        </AnimatedButton>
                      </div>
                    </form>
                  </div>
                </FadeInSection>
              )}

              {/* Step 3: Order Review */}
              {currentStep === 3 && (
                <FadeInSection>
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center mb-6">
                      <Shield className="text-green-600 mr-3" size={24} />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Review Your Order
                      </h2>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {cartItems.map((item: CartItem) => (
                          <div key={item.product.id} className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                              {item.product.image && (
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                              <p className="text-gray-500">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {formatPrice(item.product.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address Review */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Address</h3>
                      <p className="text-gray-700">
                        {shippingAddress.firstName} {shippingAddress.lastName}<br />
                        {shippingAddress.address}<br />
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
                        {shippingAddress.country}
                      </p>
                    </div>

                    {/* Payment Method Review */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Method</h3>
                      <p className="text-gray-700 capitalize">{selectedGateway}</p>
                    </div>

                    <div className="flex justify-between">
                      <AnimatedButton
                        type="button"
                        variant="secondary"
                        onClick={() => setCurrentStep(2)}
                      >
                        <ArrowLeft className="mr-2" size={16} />
                        Back to Payment
                      </AnimatedButton>
                      <AnimatedButton
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? 'Processing...' : `Place Order - ${formatPrice(cartTotal)}`}
                      </AnimatedButton>
                    </div>
                  </div>
                </FadeInSection>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <FadeInSection>
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total</span>
                      <span className="text-lg font-semibold text-gray-900">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-gray-500 text-center">
                    <Lock className="inline mr-1" size={16} />
                    Your information is secure and encrypted
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}