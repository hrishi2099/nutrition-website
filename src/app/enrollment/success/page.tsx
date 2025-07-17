'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { motion } from 'framer-motion';

interface EnrollmentData {
  id: string;
  planName: string;
  price: number;
  duration: number;
  enrolledAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

function EnrollmentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);

  useEffect(() => {
    // In a real app, you might get this from URL params or API call
    const planName = searchParams.get('planName') || 'Your Selected Plan';
    const price = searchParams.get('price') || '99';
    
    // Mock enrollment data - in real app, fetch from API
    setEnrollmentData({
      id: 'enroll_' + Date.now(),
      planName,
      price: parseFloat(price),
      duration: 12,
      enrolledAt: new Date().toISOString(),
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }
    });
  }, [searchParams]);

  const handleViewProfile = () => {
    router.push('/profile');
  };

  const handleViewPlans = () => {
    router.push('/diet-plan');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                className="mx-auto mb-6 w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Your Nutrition Journey!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Congratulations! You&apos;ve successfully enrolled in your personalized diet plan.
              </p>
            </div>
          </FadeInSection>

          {/* Enrollment Details */}
          {enrollmentData && (
            <FadeInSection delay={0.3}>
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      Enrollment Details
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Plan Name:</span>
                        <span className="font-medium text-gray-900">{enrollmentData.planName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">{enrollmentData.duration} weeks</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Price:</span>
                        <span className="font-medium text-gray-900">${enrollmentData.price}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Enrolled On:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(enrollmentData.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      What Happens Next?
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">1</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Check Your Email</h3>
                          <p className="text-sm text-gray-600">
                            We&apos;ve sent a welcome email with your login details and first week&apos;s meal plan.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">2</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Nutritionist Consultation</h3>
                          <p className="text-sm text-gray-600">
                            Our team will contact you within 24 hours to personalize your plan further.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">3</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Start Your Journey</h3>
                          <p className="text-sm text-gray-600">
                            Begin following your personalized meal plan and track your progress.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          )}

          {/* Quick Actions */}
          <FadeInSection delay={0.5}>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatedButton
                  onClick={handleViewProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-center"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>View Profile</span>
                  </div>
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={handleViewPlans}
                  className="bg-green-600 hover:bg-green-700 text-center"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>View All Plans</span>
                  </div>
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={handleGoHome}
                  className="bg-gray-600 hover:bg-gray-700 text-center"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Go Home</span>
                  </div>
                </AnimatedButton>
              </div>
            </div>
          </FadeInSection>

          {/* Support Section */}
          <FadeInSection delay={0.7}>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Need Help?
              </h2>
              <p className="text-gray-600 mb-6">
                Our support team is here to help you succeed on your nutrition journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AnimatedButton
                  onClick={() => window.location.href = 'mailto:support@nutrisap.com'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Email Support
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => router.push('/contact')}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Contact Us
                </AnimatedButton>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </PageTransition>
  );
}

export default function EnrollmentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnrollmentSuccessContent />
    </Suspense>
  );
}