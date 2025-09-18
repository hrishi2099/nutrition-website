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

export const loadStripe = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  return loadStripe(paymentConfig.stripe.publishableKey);
};