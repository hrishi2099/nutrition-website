'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TrainingStatus {
  isTraining: boolean;
  progress: number;
  stage: string;
  error?: string;
  accuracy?: number;
  loss?: number;
  lastTrainingDate?: string;
}

interface NeuralNetworkMetrics {
  accuracy: number;
  loss: number;
  totalTrainingExamples: number;
  totalIntents: number;
  vocabularySize: number;
  modelSize: string;
  lastTrainingDate: string;
  isModelLoaded: boolean;
}

interface PredictionStats {
  totalPredictions: number;
  averageConfidence: number;
  intentDistribution: Array<{
    intentName: string;
    count: number;
    avgConfidence: number;
  }>;
}

export default function NeuralNetworkPage() {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [metrics, setMetrics] = useState<NeuralNetworkMetrics | null>(null);
  const [predictionStats, setPredictionStats] = useState<PredictionStats | null>(null);
  const [shouldRetrain, setShouldRetrain] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTraining, setIsTraining] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all data in parallel
      const [statusRes, metricsRes, statsRes, retrainRes] = await Promise.all([
        fetch('/api/admin/neural-network?action=status'),
        fetch('/api/admin/neural-network?action=metrics'),
        fetch('/api/admin/neural-network?action=prediction-stats'),
        fetch('/api/admin/neural-network?action=should-retrain')
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData.status);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPredictionStats(statsData.predictionStats);
      }

      if (retrainRes.ok) {
        const retrainData = await retrainRes.json();
        setShouldRetrain(retrainData.shouldRetrain);
      }
    } catch (error) {
      console.error('Error loading neural network data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh while training
    const interval = setInterval(() => {
      if (status?.isTraining) {
        loadData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status?.isTraining]);

  const handleTrain = async (isRetraining = false) => {
    try {
      setIsTraining(true);
      
      const response = await fetch('/api/admin/neural-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isRetraining ? 'retrain' : 'train',
          epochs: isRetraining ? 50 : 100
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        await loadData();
      } else {
        alert(data.error || 'Training failed');
      }
    } catch (error) {
      console.error('Training error:', error);
      alert('Failed to start training');
    } finally {
      setIsTraining(false);
    }
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;

    try {
      const response = await fetch('/api/admin/neural-network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'predict',
          userInput: testInput
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult(data.prediction);
      } else {
        alert(data.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('Failed to test prediction');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading neural network data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Neural Network Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and monitor the chatbot's neural network for intent classification
        </p>
      </div>

      {/* Training Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Training Status
        </h2>
        
        {status ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                status.isTraining ? 'bg-yellow-500 animate-pulse' : 
                status.stage === 'completed' ? 'bg-green-500' :
                status.stage === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                {status.isTraining ? `Training: ${status.stage}` : 
                 status.stage === 'completed' ? 'Training Completed' :
                 status.stage === 'error' ? 'Training Failed' : 'Ready'}
              </span>
            </div>

            {status.isTraining && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
            )}

            {status.error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300">{status.error}</p>
              </div>
            )}

            {status.accuracy && status.loss && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <p className="text-sm text-green-600 dark:text-green-400">Accuracy</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {(status.accuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Loss</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {status.loss.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No training status available</p>
        )}
      </motion.div>

      {/* Model Metrics */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Model Metrics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(metrics.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Training Examples</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.totalTrainingExamples}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Intents</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.totalIntents}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Vocabulary Size</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.vocabularySize.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>Model Size: {metrics.modelSize}</span>
              <span>Last Training: {new Date(metrics.lastTrainingDate).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Actions
        </h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleTrain(false)}
            disabled={status?.isTraining || isTraining}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isTraining ? 'Training...' : 'Train Model'}
          </button>
          
          <button
            onClick={() => handleTrain(true)}
            disabled={status?.isTraining || isTraining || !metrics?.isModelLoaded}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isTraining ? 'Retraining...' : 'Retrain Model'}
          </button>
          
          {shouldRetrain && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                🔄 Model should be retrained due to new training data
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Test Prediction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Test Prediction
        </h2>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter text to test neural network prediction..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleTest()}
            />
            <button
              onClick={handleTest}
              disabled={!testInput.trim() || !metrics?.isModelLoaded}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Test
            </button>
          </div>

          {testResult && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Prediction Result:</h3>
              
              {testResult.neuralPrediction ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Intent:</span> {testResult.neuralPrediction.intentName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Confidence:</span> 
                    <span className={`ml-1 ${
                      testResult.neuralPrediction.confidence > 0.8 ? 'text-green-600' :
                      testResult.neuralPrediction.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(testResult.neuralPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </p>
                  
                  {testResult.topPredictions.length > 1 && (
                    <div>
                      <p className="text-sm font-medium mt-2">Top Predictions:</p>
                      <ul className="text-xs space-y-1 mt-1">
                        {testResult.topPredictions.slice(0, 3).map((pred: any, index: number) => (
                          <li key={index} className="flex justify-between">
                            <span>{pred.intentName}</span>
                            <span>{(pred.confidence * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No neural network prediction (using fallback method)
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Prediction Statistics */}
      {predictionStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Prediction Statistics
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {predictionStats.totalPredictions.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Confidence</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(predictionStats.averageConfidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {predictionStats.intentDistribution.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Intent Distribution</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {predictionStats.intentDistribution.slice(0, 10).map((intent, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm font-medium">{intent.intentName}</span>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {intent.count} predictions ({(intent.avgConfidence * 100).toFixed(1)}% avg)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}