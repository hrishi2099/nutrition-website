'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { formatHeight } from '@/lib/heightUtils';
import Link from 'next/link';
import { Package, Settings, ShoppingCart } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  activityLevel?: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE';
  createdAt: string;
  updatedAt: string;
  goals: Array<{
    id: string;
    type: string;
    target?: number;
    deadline?: string;
    createdAt: string;
  }>;
  dietPlans: Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    duration: number;
    calories: number;
    mealsPerDay: number;
    price: number;
  }>;
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [enrollments, setEnrollments] = useState<Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    duration: number;
    calories: number;
    mealsPerDay: number;
    price: number;
  }>>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProfile();
      fetchEnrollments();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setEnrollmentsLoading(true);
      const response = await fetch('/api/test-enrollments', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.log('Response not ok, status:', response.status);
        setEnrollments([]);
        return;
      }

      const responseText = await response.text();

      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.log('Received HTML instead of JSON, setting empty enrollments');
        setEnrollments([]);
        return;
      }

      try {
        const data = JSON.parse(responseText);
        setEnrollments(data.enrollments || []);
      } catch (parseError) {
        console.log('JSON parse error, setting empty enrollments:', parseError);
        setEnrollments([]);
      }
    } catch (err) {
      console.error('Enrollments fetch error:', err);
      setEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleUnenroll = async (planId: string) => {
    if (!confirm('Are you sure you want to unenroll from this plan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/diet-plan/enroll?dietPlanId=${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to unenroll');
      }

      // Refresh enrollments
      fetchEnrollments();
    } catch (err) {
      console.error('Unenroll error:', err);
      alert('Failed to unenroll from plan');
    }
  };

  const getActivityLevelDisplay = (level?: string) => {
    switch (level) {
      case 'SEDENTARY':
        return 'Sedentary';
      case 'LIGHTLY_ACTIVE':
        return 'Lightly Active';
      case 'MODERATELY_ACTIVE':
        return 'Moderately Active';
      case 'VERY_ACTIVE':
        return 'Very Active';
      case 'EXTREMELY_ACTIVE':
        return 'Extremely Active';
      default:
        return 'Not specified';
    }
  };

  const getGoalTypeDisplay = (type: string) => {
    switch (type) {
      case 'WEIGHT_LOSS':
        return 'Weight Loss';
      case 'WEIGHT_GAIN':
        return 'Weight Gain';
      case 'MUSCLE_GAIN':
        return 'Muscle Gain';
      case 'FAT_LOSS':
        return 'Fat Loss';
      case 'MAINTENANCE':
        return 'Maintenance';
      default:
        return type;
    }
  };

  const getPlanTypeDisplay = (type: string) => {
    switch (type) {
      case 'WEIGHT_LOSS':
        return 'Weight Loss';
      case 'MUSCLE_GAIN':
        return 'Muscle Gain';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'ATHLETIC_PERFORMANCE':
        return 'Athletic Performance';
      default:
        return type;
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <AnimatedButton onClick={() => window.location.reload()}>
            Retry
          </AnimatedButton>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                My Profile
              </h1>
              <p className="text-lg text-gray-600">
                Manage your nutrition and fitness profile
              </p>
            </div>
          </FadeInSection>

          {/* Quick Navigation */}
          <FadeInSection delay={0.1}>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/profile/orders">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
                    <Package className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">My Orders</h3>
                      <p className="text-sm text-gray-600">View order history</p>
                    </div>
                  </div>
                </Link>

                <Link href="/cart">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
                    <ShoppingCart className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Shopping Cart</h3>
                      <p className="text-sm text-gray-600">View cart items</p>
                    </div>
                  </div>
                </Link>

                <Link href="/profile/edit">
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
                    <Settings className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Edit Profile</h3>
                      <p className="text-sm text-gray-600">Update information</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2">
              <FadeInSection>
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Personal Information
                    </h2>
                    <AnimatedButton
                      onClick={() => router.push('/profile/edit')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Edit Profile
                    </AnimatedButton>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile.firstName} {profile.lastName}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-lg text-gray-900">{profile.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile.age ? `${profile.age} years` : 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile.gender || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height
                      </label>
                      <div className="flex items-center space-x-3">
                        <p className="text-lg text-gray-900">
                          {profile.height ? formatHeight(profile.height, heightUnit) : 'Not specified'}
                        </p>
                        {profile.height && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setHeightUnit('cm')}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                heightUnit === 'cm'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              CM
                            </button>
                            <button
                              onClick={() => setHeightUnit('ft')}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                heightUnit === 'ft'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              FT
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile.weight ? `${profile.weight} kg` : 'Not specified'}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Activity Level
                      </label>
                      <p className="text-lg text-gray-900">
                        {getActivityLevelDisplay(profile.activityLevel)}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInSection>

              {/* Goals Section */}
              <FadeInSection>
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    My Goals
                  </h2>
                  {profile.goals.length > 0 ? (
                    <div className="space-y-4">
                      {profile.goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {getGoalTypeDisplay(goal.type)}
                              </h3>
                              {goal.target && (
                                <p className="text-gray-600">
                                  Target: {goal.target} kg
                                </p>
                              )}
                              {goal.deadline && (
                                <p className="text-gray-600">
                                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              Created: {new Date(goal.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No goals set yet.</p>
                  )}
                </div>
              </FadeInSection>
            </div>

            {/* Diet Plans Sidebar */}
            <div className="lg:col-span-1">
              <FadeInSection>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    My Enrolled Plans
                  </h2>
                  {enrollmentsLoading ? (
                    <div className="text-center py-4">
                      <LoadingSpinner />
                    </div>
                  ) : enrollments.length > 0 ? (
                    <div className="space-y-4">
                      {enrollments.map((plan) => (
                        <div
                          key={plan.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {plan.name}
                            </h3>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Active
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {plan.description}
                          </p>
                          <div className="space-y-1 text-sm mb-4">
                            <p className="text-gray-700">
                              <span className="font-medium">Type:</span> {getPlanTypeDisplay(plan.type)}
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Duration:</span> {plan.duration} weeks
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Calories:</span> {plan.calories}/day
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Meals:</span> {plan.mealsPerDay}/day
                            </p>
                            <p className="text-gray-700">
                              <span className="font-medium">Price:</span> ${plan.price}/month
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <AnimatedButton
                              onClick={() => router.push(`/diet-plan/${plan.id}`)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs py-2"
                            >
                              View Details
                            </AnimatedButton>
                            <AnimatedButton
                              onClick={() => handleUnenroll(plan.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-xs py-2"
                            >
                              Unenroll
                            </AnimatedButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">No enrolled plans yet.</p>
                      <AnimatedButton
                        onClick={() => router.push('/diet-plan')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Browse Plans
                      </AnimatedButton>
                    </div>
                  )}
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}