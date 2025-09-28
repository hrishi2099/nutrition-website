'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import AnimatedButton from './AnimatedButton';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/utils/currency';
import { useToast } from '@/contexts/ToastContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { showToast } = useToast();


  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    setIsUpdating(productId);
    try {
      updateQuantity(productId, newQuantity);
      showToast('Cart updated successfully', 'success', 3000);
    } catch {
      showToast('Failed to update cart', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = (productId: string) => {
    try {
      removeFromCart(productId);
      showToast('Item removed from cart', 'info', 3000);
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Shopping Cart ({cart.totalItems})
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag size={64} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Add some products to get started
                  </p>
                  <Link href="/products">
                    <AnimatedButton onClick={onClose}>
                      Continue Shopping
                    </AnimatedButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${JSON.stringify(item.selectedOptions)}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                    >
                      {/* Product Image */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.product.price)}
                        </p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                              <span key={key}>
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          disabled={isUpdating === item.product.id || item.quantity <= 1}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900">
                          {isUpdating === item.product.id ? '...' : item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          disabled={isUpdating === item.product.id || item.quantity >= item.product.stockQuantity}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-4">
                {/* Summary */}
                <div className="space-y-2">
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

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link href="/checkout" className="block">
                    <AnimatedButton
                      onClick={onClose}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Proceed to Checkout
                    </AnimatedButton>
                  </Link>
                  <Link href="/cart" className="block">
                    <AnimatedButton
                      onClick={onClose}
                      variant="secondary"
                      className="w-full"
                    >
                      View Full Cart
                    </AnimatedButton>
                  </Link>
                  <button
                    onClick={clearCart}
                    className="w-full text-sm text-red-600 hover:underline"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


