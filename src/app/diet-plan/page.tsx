'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import { motion } from 'framer-motion';

const dietPlans = [
  {
    id: 1,
    name: "Weight Loss Plan",
    description: "Designed to help you lose weight safely and sustainably",
    duration: "12 weeks",
    meals: "3 meals + 2 snacks",
    calories: "1200-1500",
    price: "$99/month",
    features: [
      "Calorie-controlled meals",
      "High protein recipes",
      "Weekly meal prep guides",
      "Progress tracking tools"
    ],
    color: "black"
  },
  {
    id: 2,
    name: "Muscle Gain Plan",
    description: "Optimize your nutrition for muscle building and strength",
    duration: "16 weeks",
    meals: "4 meals + 3 snacks",
    calories: "2200-2800",
    price: "$119/month",
    features: [
      "High protein focus",
      "Pre/post workout nutrition",
      "Supplement guidance",
      "Strength training meal timing"
    ],
    color: "gray"
  },
  {
    id: 3,
    name: "Balanced Wellness",
    description: "Maintain optimal health with balanced nutrition",
    duration: "Ongoing",
    meals: "3 meals + 2 snacks",
    calories: "1800-2200",
    price: "$89/month",
    features: [
      "Balanced macronutrients",
      "Seasonal recipe variations",
      "Lifestyle integration",
      "Wellness education"
    ],
    color: "zinc"
  }
];

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
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen">
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Personalized <span className="text-black">Diet Plans</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our scientifically-designed nutrition plans tailored to help you achieve your specific health and fitness goals.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each plan is carefully crafted by our nutrition experts and can be customized to fit your preferences and dietary requirements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dietPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                className={`bg-white border-2 ${
                  selectedPlan === plan.id 
                    ? 'border-black shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300'
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
                <div className="text-black text-lg font-semibold mb-2">
                  {plan.name}
                </div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">{plan.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily Meals:</span>
                    <span className="font-medium">{plan.meals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Calories:</span>
                    <span className="font-medium">{plan.calories}</span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="text-black mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="text-2xl font-bold text-black mb-4">
                  {plan.price}
                </div>
                
                <button
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sample Meals</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get a taste of what your personalized meal plan might include. All recipes are nutritionist-approved and delicious.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleMeals.map((meal, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="text-black text-sm font-semibold mb-2">{meal.type}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{meal.name}</h3>
                  
                  <div className="flex justify-between mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{meal.calories}</div>
                      <div className="text-sm text-gray-500">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{meal.protein}</div>
                      <div className="text-sm text-gray-500">Protein</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Ingredients:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {meal.ingredients.map((ingredient, i) => (
                        <li key={i}>• {ingredient}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What&apos;s Included</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every diet plan comes with comprehensive support and resources to ensure your success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-3">Mobile App Access</h3>
              <p className="text-gray-600 text-sm">
                Track your meals, progress, and access recipes on the go with our user-friendly app.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">👨‍🍳</div>
              <h3 className="text-lg font-semibold mb-3">Chef-Designed Recipes</h3>
              <p className="text-gray-600 text-sm">
                Enjoy delicious, nutritious meals created by professional chefs and nutritionists.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold mb-3">Shopping Lists</h3>
              <p className="text-gray-600 text-sm">
                Get organized weekly shopping lists with everything you need for your meal plan.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-3">Expert Support</h3>
              <p className="text-gray-600 text-sm">
                Direct access to our nutrition team for questions and plan adjustments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied clients who have transformed their health with our personalized nutrition plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-black px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Your Free Consultation
            </Link>
            <Link
              href="/about"
              className="border border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
      </div>
    </PageTransition>
  );
}