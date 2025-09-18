import React from 'react';
import { motion } from 'framer-motion';

interface ProductCardSkeletonProps {
  delay?: number;
}

export default function ProductCardSkeleton({ delay = 0 }: ProductCardSkeletonProps) {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4">
        {/* Category */}
        <div className="h-3 bg-gray-200 rounded mb-2 w-16" />

        {/* Product Name */}
        <div className="h-5 bg-gray-200 rounded mb-3 w-3/4" />

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded ml-2 w-12" />
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-12" />
        </div>

        {/* Benefits */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-200 rounded mr-2" />
            <div className="h-3 bg-gray-200 rounded flex-1" />
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-200 rounded mr-2" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>

        {/* Button */}
        <div className="h-10 bg-gray-200 rounded-lg" />
      </div>
    </motion.div>
  );
}