'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface AnalyticsData {
  userGrowth: Array<{
    month: string;
    users: number;
    enrollments: number;
  }>;
  planPopularity: Array<{
    name: string;
    enrollments: number;
    revenue: number;
  }>;
  demographics: {
    genderDistribution: Array<{
      gender: string;
      count: number;
    }>;
    ageDistribution: Array<{
      ageRange: string;
      count: number;
    }>;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageOrderValue: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('6m');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner />
        </div>
      </AdminSidebar>
    );
  }

  if (error) {
    return (
      <AdminSidebar>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </AdminSidebar>
    );
  }

  if (!analytics) {
    return (
      <AdminSidebar>
        <div className="text-center py-12">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.revenue.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.revenue.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.revenue.averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h2>
            <div className="space-y-3">
              {analytics.userGrowth.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{item.month}</p>
                    <p className="text-sm text-gray-600">{item.enrollments} enrollments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{item.users}</p>
                    <p className="text-sm text-gray-600">new users</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Plan Popularity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Popularity</h2>
            <div className="space-y-3">
              {analytics.planPopularity.map((plan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{plan.name}</p>
                    <p className="text-sm text-gray-600">{plan.enrollments} enrollments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">${plan.revenue}</p>
                    <p className="text-sm text-gray-600">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Gender Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h2>
            <div className="space-y-3">
              {analytics.demographics.genderDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <p className="font-medium text-gray-900">{item.gender || 'Not specified'}</p>
                  <p className="text-lg font-semibold text-gray-900">{item.count}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Age Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h2>
            <div className="space-y-3">
              {analytics.demographics.ageDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <p className="font-medium text-gray-900">{item.ageRange}</p>
                  <p className="text-lg font-semibold text-gray-900">{item.count}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminSidebar>
  );
}