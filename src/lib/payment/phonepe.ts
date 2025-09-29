import crypto from 'crypto';
import { paymentConfig } from './config';

// PhonePe API Configuration
const PHONEPE_CONFIG = {
  merchantId: paymentConfig.phonepe.merchantId,
  saltKey: paymentConfig.phonepe.saltKey,
  saltIndex: paymentConfig.phonepe.saltIndex,
  // Sandbox URL - change to production when going live
  baseUrl: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  redirectUrl: process.env.PHONEPE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/phonepe/callback`,
  callbackUrl: process.env.PHONEPE_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/phonepe/callback`,
};

export interface PhonePePaymentData {
  amount: number; // in paise
  orderId: string;
  customerPhone: string;
  customerName: string;
  customerEmail: string;
  userId?: string;
}

export interface PhonePeResponse {
  transactionId: string;
  status: string;
  amount: number;
  orderId: string;
  paymentInstrument?: {
    type: string;
    utr?: string;
  };
}

export interface PhonePePaymentRequest {
  merchantTransactionId: string;
  amount: number; // Amount in paise (1 INR = 100 paise)
  userId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  orderId?: string;
}

export interface PhonePePaymentResponse {
  success: boolean;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: string;
    responseCode: string;
    paymentInstrument?: {
      type: string;
      utr?: string;
    };
  };
  error?: string;
  redirectUrl?: string;
}

class PhonePeService {
  private generateChecksum(payload: string, endpoint: string): string {
    const string = payload + endpoint + PHONEPE_CONFIG.saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    return `${sha256}###${PHONEPE_CONFIG.saltIndex}`;
  }

  private verifyChecksum(response: string, checksum: string): boolean {
    const expectedChecksum = crypto
      .createHash('sha256')
      .update(response + PHONEPE_CONFIG.saltKey)
      .digest('hex');
    return checksum === `${expectedChecksum}###${PHONEPE_CONFIG.saltIndex}`;
  }

  async createPayment(paymentRequest: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    try {
      const payload = {
        merchantId: PHONEPE_CONFIG.merchantId,
        merchantTransactionId: paymentRequest.merchantTransactionId,
        merchantUserId: paymentRequest.userId || 'USER_' + Date.now(),
        amount: paymentRequest.amount,
        redirectUrl: PHONEPE_CONFIG.redirectUrl,
        redirectMode: 'POST',
        callbackUrl: PHONEPE_CONFIG.callbackUrl,
        mobileNumber: paymentRequest.customerPhone,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const endpoint = '/pg/v1/pay';
      const checksum = this.generateChecksum(base64Payload, endpoint);

      const response = await fetch(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'accept': 'application/json'
        },
        body: JSON.stringify({
          request: base64Payload
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        return {
          success: true,
          redirectUrl: responseData.data.instrumentResponse.redirectInfo.url,
          data: {
            merchantId: payload.merchantId,
            merchantTransactionId: payload.merchantTransactionId,
            transactionId: responseData.data.transactionId,
            amount: payload.amount,
            state: 'PENDING',
            responseCode: responseData.code
          }
        };
      } else {
        return {
          success: false,
          error: responseData.message || 'Payment creation failed'
        };
      }
    } catch (error) {
      console.error('PhonePe payment creation error:', error);
      return {
        success: false,
        error: 'Payment service unavailable'
      };
    }
  }

  async verifyPayment(merchantTransactionId: string): Promise<PhonePePaymentResponse> {
    try {
      const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}`;
      const checksum = this.generateChecksum('', endpoint);

      const response = await fetch(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId,
          'accept': 'application/json'
        }
      });

      const responseData = await response.json();

      if (responseData.success) {
        const paymentData = responseData.data;
        return {
          success: true,
          data: {
            merchantId: paymentData.merchantId,
            merchantTransactionId: paymentData.merchantTransactionId,
            transactionId: paymentData.transactionId,
            amount: paymentData.amount,
            state: paymentData.state,
            responseCode: paymentData.responseCode,
            paymentInstrument: paymentData.paymentInstrument
          }
        };
      } else {
        return {
          success: false,
          error: responseData.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('PhonePe payment verification error:', error);
      return {
        success: false,
        error: 'Payment verification service unavailable'
      };
    }
  }

  generateMerchantTransactionId(prefix = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  isValidAmount(amount: number): boolean {
    // PhonePe minimum amount is 1 INR (100 paise)
    return amount >= 100 && amount <= 10000000; // Max 1 lakh INR
  }

  convertToPhonePeAmount(rupees: number): number {
    // Convert INR to paise
    return Math.round(rupees * 100);
  }

  convertFromPhonePeAmount(paise: number): number {
    // Convert paise to INR
    return paise / 100;
  }
}

export const phonePeService = new PhonePeService();

// Legacy functions for backward compatibility
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

export default phonePeService;