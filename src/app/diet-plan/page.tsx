'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import AnimatedInput from '@/components/AnimatedInput';
import LoadingSpinner from '@/components/LoadingSpinner';
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

const sampleMeals = [
  {
    type: "Breakfast",
    name: "Protein-Packed Overnight Oats",
    calories: 350,
    protein: "25g",
    ingredients: ["Rolled oats", "Greek yogurt", "Berries", "Chia seeds", "Almond butter"]
  },
  {
    type: "Lunch",
    name: "Mediterranean Quinoa Bowl",
    calories: 420,
    protein: "18g",
    ingredients: ["Quinoa", "Grilled chicken", "Cucumber", "Tomatoes", "Feta cheese", "Olive oil"]
  },
  {
    type: "Dinner",
    name: "Baked Salmon with Roasted Vegetables",
    calories: 480,
    protein: "35g",
    ingredients: ["Atlantic salmon", "Broccoli", "Sweet potato", "Asparagus", "Herbs"]
  }
];

export default function DietPlan() {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    fetchDietPlans();
  }, []);

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diet-plan');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch diet plans');
      }
      
      setDietPlans(data.dietPlans);
    } catch (err) {
      console.error('Error fetching diet plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load diet plans');
    } finally {
      setLoading(false);
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

  const filteredPlans = dietPlans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || plan.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'budget' && plan.price < 100) ||
                        (priceRange === 'premium' && plan.price >= 100);
    
    return matchesSearch && matchesType && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Diet Plans</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <AnimatedButton onClick={fetchDietPlans}>
            Try Again
          </AnimatedButton>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-gray-900">
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Personalized <span className="text-black dark:text-gray-100">Diet Plans</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Choose from our scientifically-designed nutrition plans tailored to help you achieve your specific health and fitness goals.
            </p>
            
            {/* Search and Filter Section */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="md:col-span-2">
                  <AnimatedInput
                    label=""
                    type="text"
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search diet plans..."
                    className="w-full"
                  />
                </div>
                <div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="weight">Weight Loss</option>
                    <option value="muscle">Muscle Gain</option>
                    <option value="wellness">Wellness</option>
                  </select>
                </div>
                <div>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Prices</option>
                    <option value="budget">Under $100</option>
                    <option value="premium">$100+</option>
                  </select>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Each plan is carefully crafted by our nutrition experts and can be customized to fit your preferences and dietary requirements.
            </p>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredPlans.length} of {dietPlans.length} plans
            </div>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPlans.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No plans found</h3>
                <p className="text-gray-600 dark:text-gray-300">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              filteredPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className={`bg-white dark:bg-gray-800 border-2 ${
                  selectedPlan === plan.id 
                    ? 'border-black dark:border-white shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } rounded-lg p-6 transition-all duration-300 cursor-pointer`}
                onClick={() => setSelectedPlan(plan.id)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.03,
                  y: -5,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-black dark:text-white text-lg font-semibold mb-2">
                  {plan.name}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{plan.duration} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Daily Meals:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{plan.mealsPerDay} meals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Calories:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{plan.calories} cal/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{getPlanTypeDisplay(plan.type)}</span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                    <span className="text-black dark:text-white mr-2">✓</span>
                    Personalized meal plans
                  </li>
                  <li className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                    <span className="text-black dark:text-white mr-2">✓</span>
                    Nutritionist support
                  </li>
                  <li className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                    <span className="text-black dark:text-white mr-2">✓</span>
                    Progress tracking
                  </li>
                  <li className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                    <span className="text-black dark:text-white mr-2">✓</span>
                    Recipe variations
                  </li>
                </ul>
                
                <div className="text-2xl font-bold text-black dark:text-white mb-4">
                  ${plan.price}/month
                </div>
                
                <Link href={`/diet-plan/${plan.id}`}>
                  <button
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </Link>
              </motion.div>
            ))
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Sample Meals</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get a taste of what your personalized meal plan might include. All recipes are nutritionist-approved and delicious.
            </p>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleMeals.map((meal, index) => (
              <motion.div 
                key={index} 
                className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-6">
                  <div className="text-black dark:text-white text-sm font-semibold mb-2">{meal.type}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{meal.name}</h3>
                  
                  <div className="flex justify-between mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{meal.calories}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{meal.protein}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Protein</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ingredients:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {meal.ingredients.map((ingredient, i) => (
                        <li key={i}>• {ingredient}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What&apos;s Included</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Every diet plan comes with comprehensive support and resources to ensure your success.
            </p>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Mobile App Access</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Track your meals, progress, and access recipes on the go with our user-friendly app.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-4xl mb-4">👨‍🍳</div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Chef-Designed Recipes</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Enjoy delicious, nutritious meals created by professional chefs and nutritionists.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Shopping Lists</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Get organized weekly shopping lists with everything you need for your meal plan.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Expert Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Direct access to our nutrition team for questions and plan adjustments.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInSection>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
            <p className="text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied clients who have transformed their health with our personalized nutrition plans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnimatedButton
                onClick={() => window.location.href = '/contact'}
                className="bg-white text-black hover:bg-gray-100"
              >
                Get Your Free Consultation
              </AnimatedButton>
              <AnimatedButton
                onClick={() => window.location.href = '/about'}
                className="border border-white text-white hover:bg-gray-800 dark:hover:bg-gray-700"
              >
                Learn More About Us
              </AnimatedButton>
            </div>
          </FadeInSection>
        </div>
      </section>
      </div>
    </PageTransition>
  );
}