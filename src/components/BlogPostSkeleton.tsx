import React from 'react';
import { motion } from 'framer-motion';

interface BlogPostSkeletonProps {
  delay?: number;
}

export default function BlogPostSkeleton({ delay = 0 }: BlogPostSkeletonProps) {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-pulse"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Category and Date */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-3">
          <div className="h-6 bg-gray-200 rounded w-full" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </motion.div>
  );
}