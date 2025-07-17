'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import EnrollmentModal from '@/components/EnrollmentModal';
import { motion } from 'framer-motion';

interface DietPlan {
  id: string;
  name: string;
  description: string;
  type: string;
  duration: number;
  calories: number;
  mealsPerDay: number;
  price: number;
  isActive: boolean;
  meals: Array<{
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    instructions: string;
    ingredients: Array<{
      id: string;
      name: string;
      quantity: string;
      unit: string;
    }>;
  }>;
}

export default function DietPlanDetails() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const fetchDietPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/diet-plan/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch diet plan');
      }
      
      setDietPlan(data.dietPlan);
    } catch (err) {
      console.error('Error fetching diet plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDietPlan();
  }, [fetchDietPlan]);

  const handleEnrollment = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch('/api/diet-plan/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          dietPlanId: planId,
          planType: dietPlan?.type 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      // Redirect to success page
      router.push(`/enrollment/success?planName=${encodeURIComponent(dietPlan?.name || '')}&price=${dietPlan?.price || 0}`);
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enroll in diet plan');
    } finally {
      setEnrolling(false);
    }
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setShowEnrollmentModal(true);
  };

  const getMealTypeDisplay = (type: string) => {
    switch (type) {
      case 'BREAKFAST': return 'Breakfast';
      case 'LUNCH': return 'Lunch';
      case 'DINNER': return 'Dinner';
      case 'SNACK': return 'Snack';
      default: return type;
    }
  };

  const getPlanTypeDisplay = (type: string) => {
    switch (type) {
      case 'WEIGHT_LOSS': return 'Weight Loss';
      case 'MUSCLE_GAIN': return 'Muscle Gain';
      case 'MAINTENANCE': return 'Maintenance';
      case 'ATHLETIC_PERFORMANCE': return 'Athletic Performance';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !dietPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Diet Plan Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested diet plan could not be found.'}</p>
          <AnimatedButton onClick={() => router.push('/diet-plan')}>
            Back to Diet Plans
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <FadeInSection>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {dietPlan.name}
                  </h1>
                  <p className="text-xl text-gray-600 mb-6">
                    {dietPlan.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{dietPlan.duration}</div>
                      <div className="text-sm text-gray-600">Weeks</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{dietPlan.calories}</div>
                      <div className="text-sm text-gray-600">Calories/Day</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{dietPlan.mealsPerDay}</div>
                      <div className="text-sm text-gray-600">Meals/Day</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{getPlanTypeDisplay(dietPlan.type)}</div>
                      <div className="text-sm text-gray-600">Goal</div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-24">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        ${dietPlan.price}
                      </div>
                      <div className="text-gray-600">per month</div>
                    </div>
                    
                    <AnimatedButton
                      onClick={handleEnrollClick}
                      disabled={enrolling}
                      className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </AnimatedButton>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <span className="text-green-600 mr-2">✓</span>
                        Personalized meal plans
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-green-600 mr-2">✓</span>
                        Nutritionist support
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-green-600 mr-2">✓</span>
                        Progress tracking
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-green-600 mr-2">✓</span>
                        Recipe variations
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>

        {/* Sample Meals Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <FadeInSection>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Sample Meals
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dietPlan.meals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {getMealTypeDisplay(meal.type)}
                      </span>
                      <span className="text-sm text-gray-500">{meal.calories} cal</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {meal.name}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{meal.protein}g</div>
                        <div className="text-xs text-gray-500">Protein</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{meal.carbs}g</div>
                        <div className="text-xs text-gray-500">Carbs</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{meal.fat}g</div>
                        <div className="text-xs text-gray-500">Fat</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
                      <p className="text-sm text-gray-600">{meal.instructions}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Ingredients:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {meal.ingredients.map((ingredient) => (
                          <li key={ingredient.id} className="flex justify-between">
                            <span>{ingredient.name}</span>
                            <span className="text-gray-500">{ingredient.quantity}{ingredient.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeInSection>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeInSection>
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Health?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied clients who have achieved their health goals with our personalized nutrition plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <AnimatedButton
                  onClick={handleEnrollClick}
                  disabled={enrolling}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  {enrolling ? 'Enrolling...' : 'Start Your Journey'}
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => router.push('/contact')}
                  className="border border-white text-white hover:bg-blue-700"
                >
                  Ask Questions
                </AnimatedButton>
              </div>
            </FadeInSection>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {dietPlan && (
        <EnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          dietPlan={{
            id: dietPlan.id,
            name: dietPlan.name,
            description: dietPlan.description,
            price: dietPlan.price,
            duration: dietPlan.duration,
            calories: dietPlan.calories,
            mealsPerDay: dietPlan.mealsPerDay,
          }}
          onEnroll={handleEnrollment}
        />
      )}
    </PageTransition>
  );
}