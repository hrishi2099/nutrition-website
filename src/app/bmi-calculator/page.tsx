'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import {
  calculateBMI,
  feetInchesToCm,
  poundsToKg,
  kgToPounds,
  BMIInput,
  BMIResult
} from '@/utils/bmiCalculator';
import {
  Calculator,
  User,
  Ruler,
  Scale,
  Activity,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

export default function BMICalculatorPage() {
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [useCustomFormula, setUseCustomFormula] = useState(true);

  // Form state
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [feet, setFeet] = useState<string>('');
  const [inches, setInches] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | ''>('');

  // Results
  const [result, setResult] = useState<BMIResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    if (!weight || (!height && units === 'metric') || (!feet && !inches && units === 'imperial')) {
      return;
    }

    setIsCalculating(true);

    // Convert measurements to metric
    let weightKg = parseFloat(weight);
    let heightCm = 0;

    if (units === 'imperial') {
      weightKg = poundsToKg(weightKg);
      heightCm = feetInchesToCm(parseFloat(feet) || 0, parseFloat(inches) || 0);
    } else {
      heightCm = parseFloat(height);
    }

    const input: BMIInput = {
      weight: weightKg,
      height: heightCm,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      activityLevel: activityLevel || undefined
    };

    setTimeout(() => {
      const bmiResult = calculateBMI(input, useCustomFormula);
      setResult(bmiResult);
      setIsCalculating(false);
    }, 500); // Small delay for better UX
  };

  const handleReset = () => {
    setWeight('');
    setHeight('');
    setFeet('');
    setInches('');
    setAge('');
    setGender('');
    setActivityLevel('');
    setResult(null);
  };

  const getRiskColor = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'low': return CheckCircle;
      case 'moderate': return Info;
      case 'high': return AlertTriangle;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <FadeInSection>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <Calculator className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                BMI Calculator
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Calculate your Body Mass Index with our enhanced formula that considers age, gender, and activity level for more accurate results.
              </p>
            </div>
          </FadeInSection>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calculator Form */}
            <FadeInSection>
              <motion.div
                className="bg-white rounded-2xl shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2 text-green-600" />
                  Your Information
                </h2>

                {/* Units Toggle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setUnits('metric')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        units === 'metric'
                          ? 'bg-white text-green-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Metric (kg, cm)
                    </button>
                    <button
                      onClick={() => setUnits('imperial')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        units === 'imperial'
                          ? 'bg-white text-green-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Imperial (lbs, ft)
                    </button>
                  </div>
                </div>

                {/* Weight Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Scale className="w-4 h-4 mr-1" />
                    Weight ({units === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={units === 'metric' ? 'Enter weight in kg' : 'Enter weight in lbs'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    step="0.1"
                    min="0"
                  />
                </div>

                {/* Height Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Ruler className="w-4 h-4 mr-1" />
                    Height
                  </label>
                  {units === 'metric' ? (
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Enter height in cm"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      step="0.1"
                      min="0"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={feet}
                        onChange={(e) => setFeet(e.target.value)}
                        placeholder="Feet"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                        max="8"
                      />
                      <input
                        type="number"
                        value={inches}
                        onChange={(e) => setInches(e.target.value)}
                        placeholder="Inches"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                        max="11"
                        step="0.1"
                      />
                    </div>
                  )}
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age (optional)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Age in years"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender (optional)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-1" />
                    Activity Level (optional)
                  </label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as typeof activityLevel)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (desk job, no exercise)</option>
                    <option value="light">Light (light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                    <option value="active">Active (heavy exercise 6-7 days/week)</option>
                    <option value="very_active">Very Active (physical job + exercise)</option>
                  </select>
                </div>

                {/* Custom Formula Toggle */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useCustomFormula}
                      onChange={(e) => setUseCustomFormula(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Use enhanced formula (considers age, gender)
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <AnimatedButton
                    onClick={handleCalculate}
                    disabled={!weight || (!height && units === 'metric') || (!feet && !inches && units === 'imperial') || isCalculating}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCalculating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Calculating...
                      </div>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate BMI
                      </>
                    )}
                  </AnimatedButton>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </motion.div>
            </FadeInSection>

            {/* Results */}
            <FadeInSection>
              <motion.div
                className="bg-white rounded-2xl shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                  Your Results
                </h2>

                {result ? (
                  <div className="space-y-6">
                    {/* BMI Score */}
                    <div className="text-center bg-gray-50 rounded-xl p-6">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {result.bmi}
                      </div>
                      <div className="text-lg font-medium text-gray-900">
                        {result.category}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.description}
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className={`p-4 rounded-lg flex items-center ${getRiskColor(result.riskLevel)}`}>
                      {React.createElement(getRiskIcon(result.riskLevel), { className: 'w-5 h-5 mr-2' })}
                      <span className="font-medium">
                        {result.riskLevel === 'low' && 'Low Risk'}
                        {result.riskLevel === 'moderate' && 'Moderate Risk'}
                        {result.riskLevel === 'high' && 'High Risk'}
                      </span>
                    </div>

                    {/* Healthy Weight Range */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Healthy Weight Range
                      </h3>
                      <p className="text-gray-700">
                        {units === 'metric'
                          ? `${result.healthyWeightRange.min} - ${result.healthyWeightRange.max} kg`
                          : `${kgToPounds(result.healthyWeightRange.min)} - ${kgToPounds(result.healthyWeightRange.max)} lbs`
                        }
                      </p>
                      {result.idealWeight && (
                        <p className="text-sm text-gray-600 mt-1">
                          Ideal weight: {units === 'metric'
                            ? `${result.idealWeight} kg`
                            : `${kgToPounds(result.idealWeight)} lbs`
                          }
                        </p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        Personalized Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Enter your measurements to calculate your BMI and get personalized recommendations.
                    </p>
                  </div>
                )}
              </motion.div>
            </FadeInSection>
          </div>

          {/* Information Section */}
          <FadeInSection>
            <motion.div
              className="mt-12 bg-white rounded-2xl shadow-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                About BMI and Our Enhanced Formula
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    What is BMI?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Body Mass Index (BMI) is a measure of body fat based on height and weight.
                    While it&apos;s a useful screening tool, it doesn&apos;t directly measure body fat and
                    may not be accurate for athletes or older adults.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Our Enhanced Formula
                  </h3>
                  <p className="text-gray-700">
                    Our custom formula considers additional factors like age and gender to provide
                    more personalized results. This helps account for natural variations in body
                    composition across different demographics.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    BMI Categories
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                      <span className="text-sm font-medium">Underweight</span>
                      <span className="text-sm text-gray-600">&lt; 18.5</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded">
                      <span className="text-sm font-medium">Normal</span>
                      <span className="text-sm text-gray-600">18.5 - 24.9</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-yellow-50 rounded">
                      <span className="text-sm font-medium">Overweight</span>
                      <span className="text-sm text-gray-600">25.0 - 29.9</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded">
                      <span className="text-sm font-medium">Obese</span>
                      <span className="text-sm text-gray-600">≥ 30.0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> BMI is a screening tool and should not replace professional medical advice.
                  Consult with a healthcare provider for comprehensive health assessment and personalized recommendations.
                </p>
              </div>
            </motion.div>
          </FadeInSection>
        </div>
      </div>
    </PageTransition>
  );
}