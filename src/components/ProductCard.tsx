'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import AnimatedButton from './AnimatedButton';
import FadeInSection from './FadeInSection';

interface ProductCardProps {
  product: Product;
  delay?: number;
}

export default function ProductCard({ product, delay = 0 }: ProductCardProps) {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      addToCart(product, 1);
      // You could add a toast notification here
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price / 100);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        }`}
      >
        ★
      </span>
    ));
  };

  return (
    <FadeInSection delay={delay}>
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
          
          {/* Quick View Button */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={() => setShowQuickView(true)}
              className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:bg-gray-100"
            >
              Quick View
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {product.category.name}
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {renderStars(product.rating)}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {product.weight}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-3">
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              {product.benefits.slice(0, 2).map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-1">✓</span>
                  <span className="line-clamp-1">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add to Cart Button */}
          <div className="space-y-2">
            {isInCart(product.id) ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  In Cart ({getItemQuantity(product.id)})
                </span>
                <Link
                  href="/cart"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Cart
                </Link>
              </div>
            ) : (
              <AnimatedButton
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                className={`w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  !product.inStock
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : ''
                }`}
              >
                {isAdding ? 'Adding...' : !product.inStock ? 'Out of Stock' : 'Add to Cart'}
              </AnimatedButton>
            )}
          </div>

          {/* Stock Status */}
          {product.inStock && product.stockQuantity < 10 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              Only {product.stockQuantity} left in stock!
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick View Modal */}
      {showQuickView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.name}
                </h2>
                <button
                  onClick={() => setShowQuickView(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-square relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {formatPrice(product.price)}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {product.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Benefits</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {product.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-3">
                    <AnimatedButton
                      onClick={handleAddToCart}
                      disabled={!product.inStock || isAdding}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isAdding ? 'Adding...' : 'Add to Cart'}
                    </AnimatedButton>
                    <Link href={`/products/${product.id}`}>
                      <AnimatedButton
                        variant="secondary"
                        className="flex-1"
                      >
                        View Details
                      </AnimatedButton>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FadeInSection>
  );
}


