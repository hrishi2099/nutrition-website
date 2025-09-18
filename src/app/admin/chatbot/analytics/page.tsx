'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface MatchStatistic {
  intentId: string;
  intentName: string;
  matchCount: number;
  avgConfidence: number;
}

interface TrainingAnalytics {
  statistics: MatchStatistic[];
  system_status: {
    cache_active: boolean;
    last_updated: string;
  };
}

interface TestMatch {
  intentId: string;
  intentName: string;
  confidence: number;
  matchedKeywords: string[];
  response: string;
  responseType: string;
}

export default function ChatbotAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<TestMatch | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/chatbot/training', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/chatbot/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'refresh_cache' }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh cache');
      }

      alert('Training cache refreshed successfully!');
      await fetchAnalytics();
    } catch (err) {
      alert('Failed to refresh cache: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
  };

  const testTrainingMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    try {
      setTestLoading(true);
      const response = await fetch('/api/admin/chatbot/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'test_match', 
          message: testMessage.trim(),
          context: { isAuthenticated: true }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to test message');
      }

      const data = await response.json();
      setTestResult(data.match);
    } catch (err) {
      alert('Failed to test message: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTestLoading(false);
    }
  };

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

  return (
    <AdminSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
            <p className="text-gray-600">Monitor chatbot training performance and test responses</p>
          </div>
          <button
            onClick={refreshCache}
            disabled={refreshing}
            className={`px-4 py-2 rounded text-white ${
              refreshing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 '
            }`}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Cache'}
          </button>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${analytics?.system_status.cache_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-900">
                Cache Status: {analytics?.system_status.cache_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-gray-600">
              Last Updated: {analytics?.system_status.last_updated ? new Date(analytics.system_status.last_updated).toLocaleString() : 'Unknown'}
            </div>
          </div>
        </div>

        {/* Test Training System */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Training System</h2>
          <form onSubmit={testTrainingMatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                rows={3}
                placeholder="Enter a message to test against your training data..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={testLoading}
              className={`px-4 py-2 rounded text-white ${
                testLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 '
              }`}
            >
              {testLoading ? 'Testing...' : 'Test Message'}
            </button>
          </form>

          {/* Test Result */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gray-50 rounded-lg"
            >
              <h3 className="font-medium text-gray-900 mb-2">Match Result:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Intent:</strong> {testResult.intentName}</p>
                <p><strong>Confidence:</strong> {(testResult.confidence * 100).toFixed(1)}%</p>
                <p><strong>Response Type:</strong> {testResult.responseType}</p>
                <p><strong>Matched Keywords:</strong> {testResult.matchedKeywords.join(', ') || 'None'}</p>
                <div>
                  <strong>Response:</strong>
                  <div className="mt-1 p-2 bg-white rounded border">
                    {testResult.response}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {testMessage && !testResult && !testLoading && (
            <div className="mt-6 p-4 bg-yellow-50 /20 rounded-lg">
              <p className="text-yellow-800">No training match found for this message. The chatbot would fall back to AI or rule-based responses.</p>
            </div>
          )}
        </div>

        {/* Training Statistics */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Training Performance</h2>
          </div>
          
          {analytics?.statistics.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data yet</h3>
              <p className="text-gray-600">
                Training analytics will appear here once users start interacting with the chatbot
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics?.statistics.map((stat) => (
                    <tr key={stat.intentId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.intentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.matchCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(stat.avgConfidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                stat.avgConfidence > 0.8 ? 'bg-green-500' :
                                stat.avgConfidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${stat.avgConfidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            {stat.avgConfidence > 0.8 ? 'Excellent' :
                             stat.avgConfidence > 0.6 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminSidebar>
  );
}