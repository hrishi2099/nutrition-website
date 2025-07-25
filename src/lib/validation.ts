// Input validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push(`${fieldName} is required`);
  } else if (name.trim().length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  } else if (name.trim().length > 50) {
    errors.push(`${fieldName} must be less than 50 characters`);
  } else if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    errors.push(`${fieldName} contains invalid characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateNumber(value: any, fieldName: string, min?: number, max?: number): ValidationResult {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  } else {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(num)) {
      errors.push(`${fieldName} must be a valid number`);
    } else {
      if (min !== undefined && num < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
      if (max !== undefined && num > max) {
        errors.push(`${fieldName} must be no more than ${max}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateString(value: string, fieldName: string, minLength?: number, maxLength?: number): ValidationResult {
  const errors: string[] = [];
  
  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} is required`);
  } else {
    const trimmed = value.trim();
    
    if (minLength !== undefined && trimmed.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }
    if (maxLength !== undefined && trimmed.length > maxLength) {
      errors.push(`${fieldName} must be no more than ${maxLength} characters long`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateChatMessage(message: string): ValidationResult {
  const errors: string[] = [];
  
  if (!message || message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (message.length > 2000) {
    errors.push('Message is too long (maximum 2000 characters)');
  } else if (message.length < 1) {
    errors.push('Message is too short');
  }
  
  // Check for potential XSS attempts
  if (/<script|javascript:|on\w+\s*=|<iframe|<embed|<object/i.test(message)) {
    errors.push('Message contains invalid content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateBlogPost(data: any): ValidationResult {
  const errors: string[] = [];
  
  const titleValidation = validateString(data.title, 'Title', 3, 200);
  const contentValidation = validateString(data.content, 'Content', 10, 50000);
  
  errors.push(...titleValidation.errors);
  errors.push(...contentValidation.errors);
  
  if (data.excerpt && data.excerpt.length > 500) {
    errors.push('Excerpt must be no more than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 10000); // Limit length
}

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}