'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  totalDietPlans: number;
  totalMeals: number;
  activeEnrollments: number;
  recentUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  }>;
  recentEnrollments: Array<{
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    dietPlan: {
      name: string;
      price: number;
    };
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'blue' 
  }: { 
    title: string; 
    value: number; 
    icon: string; 
    color?: string; 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );

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
            onClick={fetchDashboardStats}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the admin dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Diet Plans"
            value={stats?.totalDietPlans || 0}
            icon="🍎"
            color="green"
          />
          <StatCard
            title="Total Meals"
            value={stats?.totalMeals || 0}
            icon="🍽️"
            color="yellow"
          />
          <StatCard
            title="Active Enrollments"
            value={stats?.activeEnrollments || 0}
            icon="📊"
            color="purple"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
            <div className="space-y-3">
              {stats?.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                <p className="text-gray-500 text-center py-4">No recent users</p>
              )}
            </div>
          </motion.div>

          {/* Recent Enrollments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrollments</h2>
            <div className="space-y-3">
              {stats?.recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">
                      {enrollment.user.firstName} {enrollment.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{enrollment.dietPlan.name}</p>
                    <p className="text-sm text-green-600">${enrollment.dietPlan.price}/month</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {(!stats?.recentEnrollments || stats.recentEnrollments.length === 0) && (
                <p className="text-gray-500 text-center py-4">No recent enrollments</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminSidebar>
  );
}