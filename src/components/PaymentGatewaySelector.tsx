'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PaymentGateway, availableGateways } from '@/lib/payment/config';
import { usePayment } from '@/contexts/PaymentContext';
import { CreditCard, Smartphone, Wallet, Shield } from 'lucide-react';

interface PaymentGatewaySelectorProps {
  onSelect?: (gateway: PaymentGateway) => void;
}

const gatewayInfo = {
  razorpay: {
    name: 'Razorpay',
    icon: CreditCard,
    description: 'Secure payments with cards, UPI, and wallets',
    color: 'bg-blue-500',
    methods: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallets'],
  },
  stripe: {
    name: 'Stripe',
    icon: Shield,
    description: 'International payments with enhanced security',
    color: 'bg-purple-500',
    methods: ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
  },
  phonepe: {
    name: 'PhonePe',
    icon: Smartphone,
    description: 'Quick UPI payments with PhonePe',
    color: 'bg-purple-600',
    methods: ['UPI', 'PhonePe Wallet', 'Cards'],
  },
  paytm: {
    name: 'Paytm',
    icon: Wallet,
    description: 'Pay with Paytm wallet and UPI',
    color: 'bg-blue-600',
    methods: ['UPI', 'Paytm Wallet', 'Net Banking'],
  },
};

export default function PaymentGatewaySelector({ onSelect }: PaymentGatewaySelectorProps) {
  const { selectedGateway, setSelectedGateway } = usePayment();
  const gateways = availableGateways();

  const handleSelect = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    onSelect?.(gateway);
  };

  if (gateways.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">No payment gateways configured</p>
        <p className="text-red-600 text-sm mt-1">
          Please contact support or configure payment methods in environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Choose Payment Method
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gateway) => {
          const info = gatewayInfo[gateway];
          const Icon = info.icon;
          const isSelected = selectedGateway === gateway;

          return (
            <motion.div
              key={gateway}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleSelect(gateway)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start space-x-3">
                <div className={`${info.color} text-white p-2 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {info.name}
                    </h4>
                    {isSelected && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mt-1 mb-3">
                    {info.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {info.methods.map((method) => (
                      <span
                        key={method}
                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedGateway && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Secure payment with {gatewayInfo[selectedGateway].name}
            </span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Your payment information is encrypted and secure.
          </p>
        </motion.div>
      )}
    </div>
  );
}