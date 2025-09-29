// BMI Calculator utilities with custom formula support

export interface BMIInput {
  weight: number; // in kg
  height: number; // in cm
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface BMIResult {
  bmi: number;
  category: string;
  description: string;
  healthyWeightRange: {
    min: number;
    max: number;
  };
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  idealWeight?: number;
}

// Standard BMI formula
export function calculateStandardBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

// Custom enhanced BMI formula that considers age and gender
export function calculateCustomBMI(input: BMIInput): number {
  const { weight, height, age, gender } = input;
  const standardBMI = calculateStandardBMI(weight, height);

  // Base calculation
  let adjustedBMI = standardBMI;

  // Age adjustment (BMI tends to be higher with age)
  if (age) {
    if (age >= 65) {
      adjustedBMI *= 0.95; // Slight adjustment for older adults
    } else if (age >= 40) {
      adjustedBMI *= 0.98;
    }
  }

  // Gender adjustment (men typically have more muscle mass)
  if (gender === 'male') {
    adjustedBMI *= 0.97;
  } else if (gender === 'female') {
    adjustedBMI *= 1.02;
  }

  return Math.round(adjustedBMI * 10) / 10;
}

// Get BMI category and description
export function getBMICategory(bmi: number): { category: string; description: string; riskLevel: 'low' | 'moderate' | 'high' } {
  if (bmi < 16) {
    return {
      category: 'Severely Underweight',
      description: 'Significantly below healthy weight range',
      riskLevel: 'high'
    };
  } else if (bmi < 18.5) {
    return {
      category: 'Underweight',
      description: 'Below healthy weight range',
      riskLevel: 'moderate'
    };
  } else if (bmi < 25) {
    return {
      category: 'Normal Weight',
      description: 'Within healthy weight range',
      riskLevel: 'low'
    };
  } else if (bmi < 30) {
    return {
      category: 'Overweight',
      description: 'Above healthy weight range',
      riskLevel: 'moderate'
    };
  } else if (bmi < 35) {
    return {
      category: 'Obese Class I',
      description: 'Moderately obese',
      riskLevel: 'high'
    };
  } else if (bmi < 40) {
    return {
      category: 'Obese Class II',
      description: 'Severely obese',
      riskLevel: 'high'
    };
  } else {
    return {
      category: 'Obese Class III',
      description: 'Very severely obese',
      riskLevel: 'high'
    };
  }
}

// Calculate healthy weight range
export function getHealthyWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  const minWeight = 18.5 * (heightM * heightM);
  const maxWeight = 24.9 * (heightM * heightM);

  return {
    min: Math.round(minWeight * 10) / 10,
    max: Math.round(maxWeight * 10) / 10
  };
}

// Calculate ideal weight using multiple formulas
export function calculateIdealWeight(heightCm: number, gender: 'male' | 'female'): number {
  const heightInches = heightCm / 2.54;

  // Robinson Formula (1983)
  let idealWeight: number;
  if (gender === 'male') {
    idealWeight = 52 + 1.9 * (heightInches - 60);
  } else {
    idealWeight = 49 + 1.7 * (heightInches - 60);
  }

  return Math.round(idealWeight * 10) / 10;
}

// Get personalized recommendations
export function getBMIRecommendations(input: BMIInput, bmi: number): string[] {
  const { category, riskLevel } = getBMICategory(bmi);
  const recommendations: string[] = [];

  if (riskLevel === 'high') {
    recommendations.push('Consult with a healthcare professional for personalized guidance');
  }

  if (category.includes('Underweight')) {
    recommendations.push('Focus on nutrient-dense, calorie-rich foods');
    recommendations.push('Consider strength training to build muscle mass');
    recommendations.push('Eat frequent, smaller meals throughout the day');
    recommendations.push('Include healthy fats like nuts, avocados, and olive oil');
  } else if (category === 'Normal Weight') {
    recommendations.push('Maintain your current healthy lifestyle');
    recommendations.push('Continue regular physical activity');
    recommendations.push('Focus on balanced nutrition with whole foods');
    recommendations.push('Monitor your weight regularly');
  } else if (category === 'Overweight' || category.includes('Obese')) {
    recommendations.push('Create a moderate caloric deficit through diet and exercise');
    recommendations.push('Increase physical activity gradually');
    recommendations.push('Focus on whole foods and reduce processed foods');
    recommendations.push('Consider portion control strategies');
    recommendations.push('Stay hydrated and get adequate sleep');
  }

  // Activity level specific recommendations
  if (input.activityLevel === 'sedentary') {
    recommendations.push('Incorporate more movement into your daily routine');
    recommendations.push('Start with light exercises like walking');
  } else if (input.activityLevel === 'very_active') {
    recommendations.push('Ensure adequate nutrition to support your active lifestyle');
    recommendations.push('Focus on recovery and rest days');
  }

  return recommendations;
}

// Main BMI calculation function with custom formula
export function calculateBMI(input: BMIInput, useCustomFormula: boolean = true): BMIResult {
  const bmi = useCustomFormula ? calculateCustomBMI(input) : calculateStandardBMI(input.weight, input.height);
  const categoryInfo = getBMICategory(bmi);
  const healthyWeightRange = getHealthyWeightRange(input.height);
  const recommendations = getBMIRecommendations(input, bmi);

  let idealWeight: number | undefined;
  if (input.gender) {
    idealWeight = calculateIdealWeight(input.height, input.gender);
  }

  return {
    bmi,
    category: categoryInfo.category,
    description: categoryInfo.description,
    healthyWeightRange,
    recommendations,
    riskLevel: categoryInfo.riskLevel,
    idealWeight
  };
}

// Convert height from feet/inches to cm
export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round(((feet * 12) + inches) * 2.54 * 10) / 10;
}

// Convert weight from pounds to kg
export function poundsToKg(pounds: number): number {
  return Math.round(pounds * 0.453592 * 10) / 10;
}

// Convert weight from kg to pounds
export function kgToPounds(kg: number): number {
  return Math.round(kg / 0.453592 * 10) / 10;
}

// Convert height from cm to feet/inches
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;

  return { feet, inches };
}