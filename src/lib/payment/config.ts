export interface PaymentConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    enabled: boolean;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    enabled: boolean;
  };
  paytm: {
    merchantId: string;
    merchantKey: string;
    website: string;
    industryType: string;
    enabled: boolean;
  };
  phonepe: {
    merchantId: string;
    saltKey: string;
    saltIndex: string;
    enabled: boolean;
  };
}

export const paymentConfig: PaymentConfig = {
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    enabled: Boolean(process.env.RAZORPAY_KEY_ID),
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    enabled: Boolean(process.env.STRIPE_SECRET_KEY),
  },
  paytm: {
    merchantId: process.env.PAYTM_MERCHANT_ID || '',
    merchantKey: process.env.PAYTM_MERCHANT_KEY || '',
    website: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
    industryType: process.env.PAYTM_INDUSTRY_TYPE || 'Retail',
    enabled: Boolean(process.env.PAYTM_MERCHANT_ID),
  },
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || '',
    saltKey: process.env.PHONEPE_SALT_KEY || '',
    saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
    enabled: Boolean(process.env.PHONEPE_MERCHANT_ID),
  },
};

export type PaymentGateway = 'razorpay' | 'stripe' | 'paytm' | 'phonepe';

export const availableGateways = (): PaymentGateway[] => {
  const gateways: PaymentGateway[] = [];

  if (paymentConfig.razorpay.enabled) gateways.push('razorpay');
  if (paymentConfig.stripe.enabled) gateways.push('stripe');
  if (paymentConfig.paytm.enabled) gateways.push('paytm');
  if (paymentConfig.phonepe.enabled) gateways.push('phonepe');

  // For demo purposes, always have at least Razorpay available
  if (gateways.length === 0) {
    gateways.push('razorpay');
  }

  return gateways;
};