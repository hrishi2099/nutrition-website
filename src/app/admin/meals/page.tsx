'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface Meal {
  id: string;
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
  dietPlan: {
    id: string;
    name: string;
    type: string;
  };
  ingredients: Array<{
    id: string;
    name: string;
    quantity: string;
    unit: string;
  }>;
}

export default function AdminMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/meals', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }

      const data = await response.json();
      if (data.success) {
        setMeals(data.meals || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/meals/${mealId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      setMeals(meals.filter(meal => meal.id !== mealId));
      setSelectedMeal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal');
    }
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meal.dietPlan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || meal.type === filterType;
    return matchesSearch && matchesType;
  });

  const getMealTypeColor = (type: string) => {
    const colors = {
      'BREAKFAST': 'bg-yellow-100 text-yellow-800',
      'LUNCH': 'bg-green-100 text-green-800',
      'DINNER': 'bg-blue-100 text-blue-800',
      'SNACK': 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meals Management</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage all meals across diet plans</p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded"
          >
            {error}
          </motion.div>
        )}

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Meals
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search by meal name or diet plan..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Types</option>
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
          </div>
        </div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMeals.map((meal) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{meal.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(meal.type)}`}>
                    {meal.type}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <p><strong>Diet Plan:</strong> {meal.dietPlan.name}</p>
                  <p><strong>Calories:</strong> {meal.calories}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <p><strong>Protein:</strong> {meal.protein}g</p>
                    <p><strong>Carbs:</strong> {meal.carbs}g</p>
                    <p><strong>Fat:</strong> {meal.fat}g</p>
                  </div>
                </div>

                {meal.ingredients.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ingredients:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {meal.ingredients.slice(0, 3).map((ingredient) => (
                        <span key={ingredient.id} className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 mr-1 mb-1 text-gray-900 dark:text-gray-300">
                          {ingredient.name}
                        </span>
                      ))}
                      {meal.ingredients.length > 3 && (
                        <span className="text-gray-500 dark:text-gray-400">+{meal.ingredients.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setSelectedMeal(meal)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredMeals.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No meals found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm || filterType !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Meals are created as part of diet plans.'}
            </p>
            <button
              onClick={() => window.location.href = '/admin/diet-plans'}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              Manage Diet Plans
            </button>
          </div>
        )}

        {/* Meal Detail Modal */}
        {selectedMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMeal.name}</h2>
                  <button
                    onClick={() => setSelectedMeal(null)}
                    className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Type: <span className={`px-2 py-1 rounded text-sm ${getMealTypeColor(selectedMeal.type)}`}>{selectedMeal.type}</span></p>
                    <p className="font-medium text-gray-900 dark:text-white">Diet Plan: {selectedMeal.dietPlan.name}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedMeal.calories}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedMeal.protein}g</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{selectedMeal.carbs}g</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{selectedMeal.fat}g</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Fat</p>
                    </div>
                  </div>

                  {selectedMeal.ingredients.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Ingredients:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedMeal.ingredients.map((ingredient) => (
                          <div key={ingredient.id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <span className="font-medium text-gray-900 dark:text-white">{ingredient.name}</span>
                            <span className="text-gray-600 dark:text-gray-300 ml-2">{ingredient.quantity} {ingredient.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMeal.instructions && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Instructions:</h3>
                      <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">{selectedMeal.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}