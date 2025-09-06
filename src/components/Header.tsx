'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/admin/verify', {
            credentials: 'include',
          });
          setIsAdmin(response.ok);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated]);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-32 flex items-center justify-center bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 rounded-lg">
                <span className="text-white dark:text-gray-900 font-bold text-xl">NutriSap</span>
              </div>
            </Link>
          </div>
          
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                About
              </Link>
              <Link href="/diet-plan" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Diet Plans
              </Link>
              <Link href="/blog" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Blog
              </Link>
              <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                Contact
              </Link>
            </div>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-300 text-sm">
                  Welcome, {user?.firstName}
                </span>
                <Link
                  href="/profile"
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-blue-600 text-white px-3 py-2 text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white focus:outline-none focus:text-black dark:focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/diet-plan"
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Diet Plans
              </Link>
              <Link
                href="/blog"
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300">
                      Welcome, {user?.firstName}
                    </div>
                    <Link
                      href="/profile"
                      className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="bg-blue-600 text-white block px-3 py-2 text-base font-medium rounded-lg hover:bg-blue-700 transition-colors mt-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors w-full text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-black dark:bg-white text-white dark:text-black block px-3 py-2 text-base font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors mt-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}