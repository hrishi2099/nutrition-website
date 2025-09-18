import { paymentConfig } from './config';

export interface PhonePePaymentData {
  amount: number; // in paise
  orderId: string;
  customerPhone: string;
  customerName: string;
  customerEmail: string;
}

export interface PhonePeResponse {
  transactionId: string;
  status: string;
  amount: number;
  orderId: string;
}

export const createPhonePePayment = async (paymentData: PhonePePaymentData) => {
  if (!paymentConfig.phonepe.enabled) {
    throw new Error('PhonePe is not configured');
  }

  try {
    const response = await fetch('/api/payment/phonepe/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate PhonePe payment');
    }

    return await response.json();
  } catch (error) {
    console.error('PhonePe payment initiation error:', error);
    throw error;
  }
};

export const verifyPhonePePayment = async (transactionId: string) => {
  try {
    const response = await fetch('/api/payment/phonepe/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionId }),
    });

    if (!response.ok) {
      throw new Error('PhonePe payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('PhonePe payment verification error:', error);
    throw error;
  }
};