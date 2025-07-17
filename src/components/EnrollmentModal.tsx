'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';
import LoadingSpinner from './LoadingSpinner';

interface DietPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  calories: number;
  mealsPerDay: number;
}

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dietPlan: DietPlan;
  onEnroll: (planId: string) => Promise<void>;
}

export default function EnrollmentModal({
  isOpen,
  onClose,
  dietPlan,
  onEnroll,
}: EnrollmentModalProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleEnrollment = async () => {
    if (!agreed) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setIsEnrolling(true);
    try {
      await onEnroll(dietPlan.id);
      onClose();
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleClose = () => {
    if (!isEnrolling) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Enroll in Diet Plan
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isEnrolling}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Plan Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {dietPlan.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {dietPlan.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium ml-2">{dietPlan.duration} weeks</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Calories:</span>
                    <span className="font-medium ml-2">{dietPlan.calories}/day</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Meals:</span>
                    <span className="font-medium ml-2">{dietPlan.mealsPerDay}/day</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium ml-2">${dietPlan.price}/month</span>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  What&apos;s Included:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Personalized meal plans tailored to your goals
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Detailed recipes with step-by-step instructions
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Weekly shopping lists and meal prep guides
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Access to certified nutritionist support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Progress tracking and plan adjustments
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    24/7 access to our nutrition platform
                  </li>
                </ul>
              </div>

              {/* Pricing */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-blue-600">Monthly Subscription</div>
                    <div className="text-2xl font-bold text-blue-900">
                      ${dietPlan.price}
                    </div>
                    <div className="text-sm text-blue-600">
                      Cancel anytime • No hidden fees
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="mb-6">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    disabled={isEnrolling}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-800">
                      terms and conditions
                    </a>{' '}
                    and understand that this is a monthly subscription that can be cancelled at any time.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <AnimatedButton
                  onClick={handleClose}
                  disabled={isEnrolling}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </AnimatedButton>
                <AnimatedButton
                  onClick={handleEnrollment}
                  disabled={isEnrolling || !agreed}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isEnrolling ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner />
                      <span>Enrolling...</span>
                    </div>
                  ) : (
                    'Enroll Now'
                  )}
                </AnimatedButton>
              </div>

              {/* Additional Info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>
                  By enrolling, you&apos;ll get immediate access to your personalized meal plan.
                  Our team will contact you within 24 hours to customize your plan further.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}