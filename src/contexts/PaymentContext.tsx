'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PaymentGateway } from '@/lib/payment/config';

export interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
}

interface PaymentContextType {
  selectedGateway: PaymentGateway | null;
  setSelectedGateway: (gateway: PaymentGateway | null) => void;
  paymentData: PaymentData | null;
  setPaymentData: (data: PaymentData | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  paymentStatus: 'idle' | 'processing' | 'success' | 'failed';
  setPaymentStatus: (status: 'idle' | 'processing' | 'success' | 'failed') => void;
  paymentError: string | null;
  setPaymentError: (error: string | null) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const value: PaymentContextType = {
    selectedGateway,
    setSelectedGateway,
    paymentData,
    setPaymentData,
    isProcessing,
    setIsProcessing,
    paymentStatus,
    setPaymentStatus,
    paymentError,
    setPaymentError,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};