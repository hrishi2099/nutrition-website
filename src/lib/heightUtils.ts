// Height conversion utilities

export interface HeightInFeet {
  feet: number;
  inches: number;
}

export interface HeightData {
  value: number;
  unit: 'cm' | 'ft';
  feet?: number;
  inches?: number;
}

/**
 * Convert centimeters to feet and inches
 */
export function cmToFeetInches(cm: number): HeightInFeet {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  
  return { feet, inches };
}

/**
 * Convert feet and inches to centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54 * 10) / 10; // Round to 1 decimal place
}

/**
 * Format height display string based on unit
 */
export function formatHeight(height: number, unit: 'cm' | 'ft'): string {
  if (unit === 'cm') {
    return `${height} cm`;
  } else {
    const { feet, inches } = cmToFeetInches(height);
    return `${feet}' ${inches}"`;
  }
}

/**
 * Parse height input and convert to centimeters for storage
 */
export function parseHeightInput(
  value: string | number,
  unit: 'cm' | 'ft',
  feet?: string | number,
  inches?: string | number
): number | null {
  if (unit === 'cm') {
    const cm = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(cm) ? null : cm;
  } else {
    const feetNum = typeof feet === 'string' ? parseInt(feet) : (feet || 0);
    const inchesNum = typeof inches === 'string' ? parseInt(inches) : (inches || 0);
    
    if (isNaN(feetNum) || isNaN(inchesNum)) return null;
    if (feetNum < 0 || inchesNum < 0 || inchesNum >= 12) return null;
    
    return feetInchesToCm(feetNum, inchesNum);
  }
}

/**
 * Validate height input based on unit
 */
export function validateHeight(
  value: string | number,
  unit: 'cm' | 'ft',
  feet?: string | number,
  inches?: string | number
): { isValid: boolean; error?: string } {
  if (unit === 'cm') {
    const cm = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(cm)) {
      return { isValid: false, error: 'Please enter a valid height in centimeters' };
    }
    if (cm < 50 || cm > 300) {
      return { isValid: false, error: 'Height must be between 50 and 300 cm' };
    }
    return { isValid: true };
  } else {
    const feetNum = typeof feet === 'string' ? parseInt(feet) : (feet || 0);
    const inchesNum = typeof inches === 'string' ? parseInt(inches) : (inches || 0);
    
    if (isNaN(feetNum) || isNaN(inchesNum)) {
      return { isValid: false, error: 'Please enter valid feet and inches' };
    }
    if (feetNum < 0 || feetNum > 9) {
      return { isValid: false, error: 'Feet must be between 0 and 9' };
    }
    if (inchesNum < 0 || inchesNum >= 12) {
      return { isValid: false, error: 'Inches must be between 0 and 11' };
    }
    
    const totalCm = feetInchesToCm(feetNum, inchesNum);
    if (totalCm < 50 || totalCm > 300) {
      return { isValid: false, error: 'Height must be between 1\'8" and 9\'10"' };
    }
    
    return { isValid: true };
  }
}