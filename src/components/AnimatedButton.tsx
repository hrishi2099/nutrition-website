'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function AnimatedButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary'
}: AnimatedButtonProps) {
  const baseClasses = `
    px-6 py-3 rounded-lg font-semibold transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-black dark:focus:ring-white shadow-lg dark:shadow-gray-500/20',
    secondary: 'border-2 border-black dark:border-white text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-black dark:focus:ring-white shadow-lg dark:shadow-gray-500/20'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95 
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}