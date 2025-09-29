'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import Cart from './Cart';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="h-10 w-32 flex items-center justify-center rounded-lg transition-transform group-hover:scale-105">
                <Image src="/logoLight.svg" alt="NutriSap Logo" width={128} height={40} />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-1">
              <Link href="/" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                Home
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                About
              </Link>
              <Link href="/diet-plan" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                Diet Plans
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                Products
              </Link>
              <Link href="/bmi-calculator" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                BMI Calculator
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                Blog
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50">
                Contact
              </Link>
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
            >
              <ShoppingCart size={20} />
              {cart.totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                >
                  {cart.totalItems}
                </motion.span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-green-600" />
                  </div>
                  <span className="hidden lg:block">{user?.firstName}</span>
                  <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1"
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/profile/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        href="/profile/pdfs"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My PDFs
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-green-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <ShoppingCart size={20} />
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cart.totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="px-4 pt-4 pb-6 space-y-1 bg-white border-t border-gray-100">
                {/* Navigation Links */}
                <div className="space-y-1 mb-4">
                  <Link
                    href="/"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/diet-plan"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Diet Plans
                  </Link>
                  <Link
                    href="/products"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Products
                  </Link>
                  <Link
                    href="/bmi-calculator"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    BMI Calculator
                  </Link>
                  <Link
                    href="/blog"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blog
                  </Link>
                  <Link
                    href="/contact"
                    className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </div>

                {/* User Section */}
                <div className="border-t border-gray-100 pt-4">
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-base font-medium text-gray-600 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-green-600" />
                        </div>
                        <span>Welcome, {user?.firstName}</span>
                      </div>
                      <Link
                        href="/profile"
                        className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/profile/orders"
                        className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        href="/profile/pdfs"
                        className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My PDFs
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="bg-blue-600 text-white block px-3 py-3 text-base font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
                        className="text-red-600 hover:bg-red-50 block px-3 py-3 text-base font-medium transition-colors w-full text-left rounded-lg"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-green-600 hover:bg-green-50 block px-3 py-3 text-base font-medium transition-colors rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="bg-green-600 text-white block px-3 py-3 text-base font-medium rounded-lg hover:bg-green-700 transition-colors text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}