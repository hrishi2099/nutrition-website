'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
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
  createdAt: string;
  updatedAt: string;
  userId?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  meals: Array<{
    id: string;
    name: string;
    type: string;
    calories: number;
  }>;
}

export default function DietPlansPage() {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'WEIGHT_LOSS',
    duration: 12,
    calories: 1500,
    mealsPerDay: 3,
    price: 99,
  });

  useEffect(() => {
    fetchDietPlans();
  }, []);

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/diet-plans', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch diet plans');
      }

      const data = await response.json();
      setDietPlans(data.dietPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diet plans');
    } finally {
      setLoading(false);
    }
  };

  const createDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/diet-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create diet plan');
      }

      const data = await response.json();
      setDietPlans([data.dietPlan, ...dietPlans]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        type: 'WEIGHT_LOSS',
        duration: 12,
        calories: 1500,
        mealsPerDay: 3,
        price: 99,
      });
    } catch (err) {
      alert('Failed to create diet plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/diet-plans/${planId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan status');
      }

      const data = await response.json();
      setDietPlans(dietPlans.map(plan => 
        plan.id === planId ? { ...plan, isActive: data.dietPlan.isActive } : plan
      ));
    } catch (err) {
      alert('Failed to update plan status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const deleteDietPlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/diet-plans/${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete diet plan');
      }

      setDietPlans(dietPlans.filter(plan => plan.id !== planId));
      setSelectedPlan(null);
    } catch (err) {
      alert('Failed to delete diet plan: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
      <AdminSidebar>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </AdminSidebar>
    );
  }

  if (error) {
    return (
      <AdminSidebar>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchDietPlans}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Try Again
          </button>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diet Plans</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage diet plans and meal configurations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Create New Plan
          </button>
        </div>

        {/* Diet Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dietPlans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {plan.userId && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Enrolled
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{plan.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{getPlanTypeDisplay(plan.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.duration} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Calories:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.calories}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Meals:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.mealsPerDay}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${plan.price}/month</span>
                </div>
              </div>

              {plan.user && (
                <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900 rounded">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Enrolled by: {plan.user.firstName} {plan.user.lastName}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  View Details
                </button>
                <button
                  onClick={() => togglePlanStatus(plan.id, plan.isActive)}
                  className={`flex-1 px-3 py-1 rounded text-sm ${
                    plan.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteDietPlan(plan.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Diet Plan Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Diet Plan</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={createDietPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="WEIGHT_LOSS">Weight Loss</option>
                    <option value="MUSCLE_GAIN">Muscle Gain</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="ATHLETIC_PERFORMANCE">Athletic Performance</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (weeks)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Calories/day
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1000"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Meals/day
                    </label>
                    <input
                      type="number"
                      value={formData.mealsPerDay}
                      onChange={(e) => setFormData({ ...formData, mealsPerDay: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Create Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Plan Details Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Diet Plan Details</h2>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{selectedPlan.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <p className="text-gray-900 dark:text-white">{getPlanTypeDisplay(selectedPlan.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                    <p className="text-gray-900 dark:text-white">{selectedPlan.duration} weeks</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Calories</label>
                    <p className="text-gray-900 dark:text-white">{selectedPlan.calories}/day</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                    <p className="text-gray-900 dark:text-white">${selectedPlan.price}/month</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meals ({selectedPlan.meals.length})</label>
                  {selectedPlan.meals.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPlan.meals.map((meal) => (
                        <div key={meal.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                          <p className="font-medium text-gray-900 dark:text-white">{meal.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{meal.type} • {meal.calories} calories</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No meals configured</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}