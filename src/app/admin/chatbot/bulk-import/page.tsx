'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from 'framer-motion';

interface ImportTemplate {
  intent: string;
  description?: string;
  category: string;
  priority: number;
  examples: Array<{
    userInput: string;
    confidence: number;
  }>;
  responses: Array<{
    response: string;
    responseType: string;
    priority: number;
    conditions?: Record<string, any>;
    variables?: Record<string, any>;
  }>;
}

export default function BulkImportPage() {
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  const sampleTemplate: ImportTemplate[] = [
    {
      intent: 'weight_loss_tips',
      description: 'Provides tips for healthy weight loss',
      category: 'nutrition',
      priority: 5,
      examples: [
        { userInput: 'How can I lose weight?', confidence: 1.0 },
        { userInput: 'What are some weight loss tips?', confidence: 0.9 },
        { userInput: 'Help me lose weight healthily', confidence: 0.8 }
      ],
      responses: [
        {
          response: 'Here are some healthy weight loss tips: 1) Eat in a caloric deficit, 2) Include protein in every meal, 3) Stay hydrated, 4) Exercise regularly, 5) Get adequate sleep.',
          responseType: 'text',
          priority: 1
        }
      ]
    }
  ];

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please enter import data');
      return;
    }

    try {
      setImporting(true);
      const data = JSON.parse(importData);
      
      const response = await fetch('/api/admin/chatbot/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intents: Array.isArray(data) ? data : [data] }),
      });

      if (!response.ok) {
        throw new Error('Failed to import data');
      }

      const result = await response.json();
      setResults(result);
      
      if (result.errors.length === 0) {
        setImportData('');
      }
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Invalid JSON format'));
    } finally {
      setImporting(false);
    }
  };

  const loadSample = () => {
    setImportData(JSON.stringify(sampleTemplate, null, 2));
  };

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Import Training Data</h1>
            <p className="text-gray-600 dark:text-gray-300">Import multiple intents, examples, and responses at once</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Import Format</h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Import data should be a JSON array of intent objects. Each intent should include:
          </p>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
            <li><strong>intent</strong>: Name of the intent</li>
            <li><strong>description</strong>: Optional description</li>
            <li><strong>category</strong>: nutrition, fitness, general, health, or recipes</li>
            <li><strong>priority</strong>: Priority level (0-10)</li>
            <li><strong>examples</strong>: Array of training examples with userInput and confidence</li>
            <li><strong>responses</strong>: Array of responses with response, responseType, and priority</li>
          </ul>
          <button
            onClick={loadSample}
            className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Load Sample Template
          </button>
        </div>

        {/* Import Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                JSON Import Data
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                placeholder="Paste your JSON data here..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleImport}
                disabled={importing || !importData.trim()}
                className="bg-green-600 dark:bg-green-700 text-white px-6 py-2 rounded hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Import Data</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setImportData('')}
                className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-600 dark:hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Results</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 dark:text-green-400">✅</span>
                <span className="text-gray-900 dark:text-white">
                  Successfully imported {results.success} intents
                </span>
              </div>
              
              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 dark:text-red-400">❌</span>
                    <span className="text-gray-900 dark:text-white">
                      {results.errors.length} errors occurred:
                    </span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                    <ul className="list-disc list-inside text-red-800 dark:text-red-200 space-y-1">
                      {results.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AdminSidebar>
  );
}