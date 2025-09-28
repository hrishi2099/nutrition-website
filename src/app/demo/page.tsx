'use client';

import React, { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedButton from '@/components/AnimatedButton';
import { useToast } from '@/contexts/ToastContext';
import { User, Shield, Database, AlertCircle, CheckCircle } from 'lucide-react';

export default function DemoPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const demoCredentials = [
    {
      email: 'demo@nutrisap.com',
      password: 'demo123',
      role: 'USER',
      description: 'Regular user with access to profiles, cart, and checkout'
    },
    {
      email: 'admin@nutrisap.com',
      password: 'admin123',
      role: 'ADMIN',
      description: 'Admin user with access to admin panel and all features'
    },
    {
      email: 'test@nutrisap.com',
      password: 'test123',
      role: 'USER',
      description: 'Test user for general testing purposes'
    },
  ];

  const handleDemoLogin = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`Welcome ${data.user.firstName}! Demo login successful.`, 'success');

        // Refresh the page to update auth state
        window.location.href = '/profile';
      } else {
        showToast('Demo login failed', 'error');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      showToast('Demo login error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Demo Mode
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Database connection is not available. Use demo credentials to test the application features without a database.
              </p>
            </div>
          </FadeInSection>

          {/* Status Alert */}
          <FadeInSection delay={0.1}>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-800 font-semibold mb-2">Database Connection Issue</h3>
                  <p className="text-amber-700 text-sm mb-3">
                    The application is running in demo mode because the database is not accessible.
                    This typically happens when:
                  </p>
                  <ul className="text-amber-700 text-sm space-y-1 ml-4">
                    <li>• Database URL is not configured correctly</li>
                    <li>• Database server is not running</li>
                    <li>• Network connectivity issues</li>
                    <li>• Database credentials are incorrect</li>
                  </ul>
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Demo Credentials */}
          <FadeInSection delay={0.2}>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <div className="flex items-center mb-6">
                <User className="text-blue-600 mr-3" size={24} />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Demo Credentials
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoCredentials.map((cred, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      {cred.role === 'ADMIN' ? (
                        <Shield className="w-6 h-6 text-purple-600 mr-2" />
                      ) : (
                        <User className="w-6 h-6 text-blue-600 mr-2" />
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        cred.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {cred.role}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <code className="block text-sm bg-gray-100 p-2 rounded">{cred.email}</code>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <code className="block text-sm bg-gray-100 p-2 rounded">{cred.password}</code>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{cred.description}</p>

                    <AnimatedButton
                      onClick={() => handleDemoLogin(cred.email, cred.password)}
                      disabled={isLoading}
                      className={`w-full ${
                        cred.role === 'ADMIN'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                    >
                      {isLoading ? 'Logging in...' : `Login as ${cred.role.toLowerCase()}`}
                    </AnimatedButton>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          {/* Features Available */}
          <FadeInSection delay={0.3}>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="text-green-600 mr-3" size={24} />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Available Features in Demo Mode
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">✅ Working Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• User authentication (demo login)</li>
                    <li>• Profile page access</li>
                    <li>• Shopping cart functionality</li>
                    <li>• Checkout process</li>
                    <li>• Payment gateway selection</li>
                    <li>• Product browsing</li>
                    <li>• Admin panel access (admin user)</li>
                    <li>• Contact information display</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">⚠️ Limited Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• No data persistence</li>
                    <li>• Cannot create new users</li>
                    <li>• No real order storage</li>
                    <li>• No user profile updates</li>
                    <li>• No admin data modifications</li>
                    <li>• No blog post management</li>
                    <li>• No diet plan enrollment</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">To Enable Full Features:</h4>
                <p className="text-blue-800 text-sm mb-2">
                  Set up a proper database connection by configuring the DATABASE_URL environment variable.
                </p>
                <div className="space-y-1 text-blue-700 text-sm">
                  <p>• <strong>For Production:</strong> Use PlanetScale, Railway, or Hostinger MySQL</p>
                  <p>• <strong>For Local Development:</strong> Install MySQL locally</p>
                  <p>• <strong>Quick Setup:</strong> See HOSTINGER_DEPLOY.md for instructions</p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </PageTransition>
  );
}