'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface AnimatedInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  min?: string;
  max?: string;
  step?: string;
}

export default function AnimatedInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = '',
  min,
  max,
  step
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <motion.input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-black focus:border-black 
            transition-all duration-300
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{
            boxShadow: "0 0 0 3px rgba(0, 0, 0, 0.1)",
            borderColor: "#000000"
          }}
        />
      </motion.div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}