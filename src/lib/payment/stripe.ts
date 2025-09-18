import { paymentConfig } from './config';

export interface StripePaymentData {
  amount: number; // in paise
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
}

export const createStripePaymentIntent = async (paymentData: StripePaymentData) => {
  if (!paymentConfig.stripe.enabled) {
    throw new Error('Stripe is not configured');
  }

  try {
    const response = await fetch('/api/payment/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Failed to create Stripe payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw error;
  }
};

export const confirmStripePayment = async (paymentIntentId: string) => {
  try {
    const response = await fetch('/api/payment/stripe/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (!response.ok) {
      throw new Error('Stripe payment confirmation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Stripe payment confirmation error:', error);
    throw error;
  }
};

// Stripe client-side loader (requires @stripe/stripe-js package)
// Uncomment and install the package when needed: npm install @stripe/stripe-js
/*
export const loadStripe = async () => {
  try {
    const stripeModule = await import('@stripe/stripe-js');
    return stripeModule.loadStripe(paymentConfig.stripe.publishableKey);
  } catch (error) {
    console.warn('Stripe not installed. Install with: npm install @stripe/stripe-js');
    return null;
  }
};
*/

export const loadStripe = async () => {
  console.warn('Stripe client not configured. Install @stripe/stripe-js package to enable Stripe payments.');
  return null;
};