'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

interface TrainingExample {
  id: string;
  userInput: string;
  keywords: string[];
  confidence: number;
  isActive: boolean;
  createdAt: string;
}

interface TrainingResponse {
  id: string;
  response: string;
  responseType: string;
  conditions?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  usageCount: number;
  successRate?: number;
  createdAt: string;
}

interface TrainingIntent {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  priority: number;
  examples: TrainingExample[];
  responses: TrainingResponse[];
}

export default function IntentDetailPage() {
  const params = useParams();
  const intentId = params.id as string;

  const [intent, setIntent] = useState<TrainingIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'examples' | 'responses'>('examples');
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const [exampleForm, setExampleForm] = useState({
    userInput: '',
    confidence: 1.0,
  });

  const [responseForm, setResponseForm] = useState({
    response: '',
    responseType: 'text',
    priority: 0,
  });

  const fetchIntentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/chatbot/intents/${intentId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch intent details');
      }

      const data = await response.json();
      const intent = data.intent;
      if (intent && intent.examples) {
        intent.examples = intent.examples.map((ex: any) => ({
          ...ex,
          keywords: typeof ex.keywords === 'string' ? JSON.parse(ex.keywords) : ex.keywords,
        }));
      }
      setIntent(intent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intent details');
    } finally {
      setLoading(false);
    }
  }, [intentId]);

  useEffect(() => {
    if (intentId) {
      fetchIntentDetails();
    }
  }, [intentId, fetchIntentDetails]);

  const addExample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/chatbot/intents/${intentId}/examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(exampleForm),
      });

      if (!response.ok) {
        throw new Error('Failed to add example');
      }

      const data = await response.json();
      const newExample = data.example;
      if (newExample && typeof newExample.keywords === 'string') {
        try {
          newExample.keywords = JSON.parse(newExample.keywords);
        } catch (e) {
          console.error("Failed to parse keywords", e);
          newExample.keywords = [];
        }
      }
      setIntent(prev => prev ? {
        ...prev,
        examples: [newExample, ...prev.examples]
      } : null);
      
      setShowExampleModal(false);
      setExampleForm({ userInput: '', confidence: 1.0 });
    } catch (err) {
      alert('Failed to add example: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const addResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/chatbot/intents/${intentId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(responseForm),
      });

      if (!response.ok) {
        throw new Error('Failed to add response');
      }

      const data = await response.json();
      setIntent(prev => prev ? {
        ...prev,
        responses: [data.response, ...prev.responses]
      } : null);
      
      setShowResponseModal(false);
      setResponseForm({ response: '', responseType: 'text', priority: 0 });
    } catch (err) {
      alert('Failed to add response: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const deleteExample = async (exampleId: string) => {
    if (!confirm('Are you sure you want to delete this example?')) return;

    try {
      const response = await fetch(`/api/admin/chatbot/examples/${exampleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete example');
      }

      setIntent(prev => prev ? {
        ...prev,
        examples: prev.examples.filter(ex => ex.id !== exampleId)
      } : null);
    } catch (err) {
      alert('Failed to delete example: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      const response = await fetch(`/api/admin/chatbot/responses/${responseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete response');
      }

      setIntent(prev => prev ? {
        ...prev,
        responses: prev.responses.filter(res => res.id !== responseId)
      } : null);
    } catch (err) {
      alert('Failed to delete response: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

  if (error || !intent) {
    return (
      <AdminSidebar>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Intent not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{intent.name}</h1>
                <p className="text-gray-600">
                  {intent.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              intent.isActive 
                ? 'bg-green-100 text-green-800 ' 
                : 'bg-red-100 text-red-800 '
            }`}>
              {intent.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
              {intent.category || 'General'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Training Examples</p>
                <p className="text-2xl font-bold text-gray-900">{intent.examples.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <span className="text-2xl">📝</span>
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
                <p className="text-sm font-medium text-gray-600">Response Options</p>
                <p className="text-2xl font-bold text-gray-900">{intent.responses.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <span className="text-2xl">💬</span>
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
                <p className="text-sm font-medium text-gray-600">Priority Level</p>
                <p className="text-2xl font-bold text-gray-900">{intent.priority}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('examples')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'examples'
                    ? 'border-blue-500 text-blue-600 '
                    : 'border-transparent text-gray-500 hover:text-gray-700  '
                }`}
              >
                Training Examples ({intent.examples.length})
              </button>
              <button
                onClick={() => setActiveTab('responses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'responses'
                    ? 'border-blue-500 text-blue-600 '
                    : 'border-transparent text-gray-500 hover:text-gray-700  '
                }`}
              >
                Response Options ({intent.responses.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'examples' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Training Examples</h3>
                  <button
                    onClick={() => setShowExampleModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Example
                  </button>
                </div>

                {intent.examples.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No training examples yet</p>
                    <button
                      onClick={() => setShowExampleModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add First Example
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {intent.examples.map((example) => (
                      <div
                        key={example.id}
                        className="bg-gray-50 rounded-lg p-4 flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{example.userInput}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Confidence: {(example.confidence * 100).toFixed(0)}%</span>
                            <span>Keywords: {example.keywords.length}</span>
                            <span className={`${example.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {example.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteExample(example.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'responses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Response Options</h3>
                  <button
                    onClick={() => setShowResponseModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Response
                  </button>
                </div>

                {intent.responses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No response options yet</p>
                    <button
                      onClick={() => setShowResponseModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add First Response
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {intent.responses.map((response) => (
                      <div
                        key={response.id}
                        className="bg-gray-50 rounded-lg p-4 flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{response.response}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Type: {response.responseType}</span>
                            <span>Priority: {response.priority}</span>
                            <span>Used: {response.usageCount} times</span>
                            <span className={`${response.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {response.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteResponse(response.id)}
                          className="text-red-600 hover:text-red-800 ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Example Modal */}
        {showExampleModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Training Example</h2>
                <button
                  onClick={() => setShowExampleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={addExample} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Input Example
                  </label>
                  <textarea
                    value={exampleForm.userInput}
                    onChange={(e) => setExampleForm({ ...exampleForm, userInput: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    rows={3}
                    placeholder="What would a user say to trigger this intent?"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    value={exampleForm.confidence}
                    onChange={(e) => setExampleForm({ ...exampleForm, confidence: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    min="0"
                    max="1"
                    step="0.1"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Example
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExampleModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Response Modal */}
        {showResponseModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Response Option</h2>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={addResponse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Text
                  </label>
                  <textarea
                    value={responseForm.response}
                    onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    rows={4}
                    placeholder="How should the bot respond?"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Response Type
                  </label>
                  <select
                    value={responseForm.responseType}
                    onChange={(e) => setResponseForm({ ...responseForm, responseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="text">Text</option>
                    <option value="template">Template</option>
                    <option value="function">Function</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={responseForm.priority}
                    onChange={(e) => setResponseForm({ ...responseForm, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    min="0"
                    max="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher priority responses are used first
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Response
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}