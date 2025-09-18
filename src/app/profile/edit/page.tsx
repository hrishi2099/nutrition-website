'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import AnimatedInput from '@/components/AnimatedInput';
import SuccessAnimation from '@/components/SuccessAnimation';
import { parseHeightInput, validateHeight, cmToFeetInches } from '@/lib/heightUtils';

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
}

export default function EditProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    height: '',
    weight: '',
    gender: '',
    activityLevel: '',
  });

  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightError, setHeightError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProfile();
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
      
      // Populate form with existing data
      setFormData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        age: data.user.age ? data.user.age.toString() : '',
        height: data.user.height ? data.user.height.toString() : '',
        weight: data.user.weight ? data.user.weight.toString() : '',
        gender: data.user.gender || '',
        activityLevel: data.user.activityLevel || '',
      });

      // Set height unit and feet/inches values if height exists
      if (data.user.height) {
        const { feet, inches } = cmToFeetInches(data.user.height);
        setHeightFeet(feet.toString());
        setHeightInches(inches.toString());
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHeightUnitChange = (unit: 'cm' | 'ft') => {
    setHeightUnit(unit);
    setHeightError(null);
    
    if (unit === 'cm' && formData.height) {
      // Keep current cm value
      return;
    } else if (unit === 'ft' && formData.height) {
      // Convert current cm to feet/inches
      const { feet, inches } = cmToFeetInches(parseFloat(formData.height));
      setHeightFeet(feet.toString());
      setHeightInches(inches.toString());
    }
  };

  const handleHeightChange = (field: 'cm' | 'feet' | 'inches', value: string) => {
    setHeightError(null);
    
    if (field === 'cm') {
      setFormData(prev => ({ ...prev, height: value }));
    } else if (field === 'feet') {
      setHeightFeet(value);
    } else if (field === 'inches') {
      setHeightInches(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate and convert height
      let heightInCm = null;
      if (heightUnit === 'cm' && formData.height) {
        const validation = validateHeight(formData.height, 'cm');
        if (!validation.isValid) {
          setHeightError(validation.error || 'Invalid height');
          return;
        }
        heightInCm = parseHeightInput(formData.height, 'cm');
      } else if (heightUnit === 'ft' && (heightFeet || heightInches)) {
        const validation = validateHeight('', 'ft', heightFeet, heightInches);
        if (!validation.isValid) {
          setHeightError(validation.error || 'Invalid height');
          return;
        }
        heightInCm = parseHeightInput('', 'ft', heightFeet, heightInches);
      }

      const submitData = {
        ...formData,
        height: heightInCm,
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/profile');
      }, 2000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !profile) {
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Edit Profile
              </h1>
              <p className="text-lg text-gray-600">
                Update your nutrition and fitness information
              </p>
            </div>
          </FadeInSection>

          <FadeInSection>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <AnimatedInput
                        label="First Name"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your first name"
                      />
                    </div>

                    <div>
                      <AnimatedInput
                        label="Last Name"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <AnimatedInput
                      label="Age"
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      min="1"
                      max="120"
                      placeholder="Enter your age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Physical Information */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Physical Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height
                      </label>
                      
                      {/* Height Unit Selector */}
                      <div className="flex space-x-2 mb-3">
                        <button
                          type="button"
                          onClick={() => handleHeightUnitChange('cm')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            heightUnit === 'cm'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 '
                          }`}
                        >
                          CM
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHeightUnitChange('ft')}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            heightUnit === 'ft'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 '
                          }`}
                        >
                          FT/IN
                        </button>
                      </div>
                      
                      {/* Height Input Fields */}
                      {heightUnit === 'cm' ? (
                        <AnimatedInput
                          label=""
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={(e) => handleHeightChange('cm', e.target.value)}
                          min="50"
                          max="300"
                          step="0.1"
                          placeholder="Enter height in cm"
                          error={heightError || undefined}
                        />
                      ) : (
                        <div className="flex space-x-3">
                          <div className="flex-1">
                            <AnimatedInput
                              label=""
                              type="number"
                              name="heightFeet"
                              value={heightFeet}
                              onChange={(e) => handleHeightChange('feet', e.target.value)}
                              min="0"
                              max="9"
                              placeholder="Feet"
                              error={heightError || undefined}
                            />
                          </div>
                          <div className="flex-1">
                            <AnimatedInput
                              label=""
                              type="number"
                              name="heightInches"
                              value={heightInches}
                              onChange={(e) => handleHeightChange('inches', e.target.value)}
                              min="0"
                              max="11"
                              placeholder="Inches"
                            />
                          </div>
                        </div>
                      )}
                      
                      {heightError && (
                        <p className="mt-1 text-sm text-red-600">{heightError}</p>
                      )}
                    </div>

                    <div>
                      <AnimatedInput
                        label="Weight (kg)"
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        min="20"
                        max="500"
                        step="0.1"
                        placeholder="Enter your weight"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Level
                    </label>
                    <select
                      name="activityLevel"
                      value={formData.activityLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    >
                      <option value="">Select activity level</option>
                      <option value="SEDENTARY">Sedentary (little to no exercise)</option>
                      <option value="LIGHTLY_ACTIVE">Lightly Active (light exercise 1-3 days/week)</option>
                      <option value="MODERATELY_ACTIVE">Moderately Active (moderate exercise 3-5 days/week)</option>
                      <option value="VERY_ACTIVE">Very Active (hard exercise 6-7 days/week)</option>
                      <option value="EXTREMELY_ACTIVE">Extremely Active (very hard exercise, physical job)</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <AnimatedButton
                    type="button"
                    onClick={() => router.push('/profile')}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </AnimatedButton>
                  
                  <AnimatedButton
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </FadeInSection>
        </div>
      </div>

      <SuccessAnimation 
        isVisible={showSuccess}
        message="Profile Updated Successfully!"
      />
    </PageTransition>
  );
}