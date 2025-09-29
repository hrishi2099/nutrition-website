'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Send, Facebook, Instagram } from 'lucide-react';

interface ContactInfo {
  companyName: string;
  email: string;
  supportEmail?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export default function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch('/api/contact-info');
      const data = await response.json();
      
      if (data.success && data.contactInfo) {
        setContactInfo(data.contactInfo);
      }
    } catch (error) {
      console.error('Error fetching contact info for footer:', error);
      // Use fallback values if API fails
      setContactInfo({
        companyName: 'NutriSap',
        email: 'info@nutrisap.com',
        phone: '+1 (555) 123-4567',
        address: '123 Wellness Street',
        city: 'Health City',
        state: 'HC',
        zipCode: '12345',
      });
    }
  };
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">NutriSap</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your trusted partner in achieving optimal health through personalized nutrition and wellness guidance.
              Transform your lifestyle with evidence-based nutrition solutions.
            </p>
            <div className="flex space-x-4">
              {contactInfo?.facebookUrl ? (
                <a href={contactInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                  <Facebook className="h-5 w-5" />
                </a>
              ) : (
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {contactInfo?.instagramUrl ? (
                <a href={contactInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                  <Instagram className="h-5 w-5" />
                </a>
              ) : (
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Products
                </Link>
              </li>
              <li>
                <Link href="/diet-plan" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Diet Plans
                </Link>
              </li>
              <li>
                <Link href="/bmi-calculator" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  BMI Calculator
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/diet-plan" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Nutrition Plans
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Health Products
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Consultations
                </Link>
              </li>
              <li>
                <Link href="/bmi-calculator" className="text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 group-hover:bg-white transition-colors"></span>
                  Health Tools
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact Info</h4>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-gray-400" />
                <a href={`mailto:${contactInfo?.email || 'info@nutrisap.com'}`} className="hover:text-white transition-colors">
                  {contactInfo?.email || 'info@nutrisap.com'}
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-gray-400" />
                <a href={`tel:${contactInfo?.phone || '+1 (555) 123-4567'}`} className="hover:text-white transition-colors">
                  {contactInfo?.phone || '+1 (555) 123-4567'}
                </a>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
                <span>{contactInfo?.address || '123 Wellness Street'}, {contactInfo?.city || 'Health City'}</span>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold mb-3 text-white">Stay Updated</h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white placeholder-gray-400 text-sm focus:outline-none focus:border-gray-500"
                />
                <button className="px-4 py-2 bg-white text-black rounded-r-md hover:bg-gray-100 transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Get nutrition tips and updates delivered to your inbox.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {contactInfo?.companyName || 'NutriSap'}. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}