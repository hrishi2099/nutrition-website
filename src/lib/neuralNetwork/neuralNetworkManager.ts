import { simpleNeuralNetwork, SimpleNeuralNetwork, IntentPrediction } from './simpleNeuralNetwork';
import { simpleTextProcessor } from './simpleTextProcessor';
import { prisma } from '@/lib/prisma';
import { devLog, logError } from '@/lib/logger';

export interface TrainingStatus {
  isTraining: boolean;
  progress: number;
  stage: string;
  error?: string;
  accuracy?: number;
  loss?: number;
  lastTrainingDate?: Date;
}

export interface NeuralNetworkMetrics {
  accuracy: number;
  loss: number;
  totalTrainingExamples: number;
  totalIntents: number;
  vocabularySize: number;
  modelSize: string;
  lastTrainingDate: Date;
  isModelLoaded: boolean;
}

export class NeuralNetworkManager {
  private classifier: SimpleNeuralNetwork;
  private trainingStatus: TrainingStatus = {
    isTraining: false,
    progress: 0,
    stage: 'idle'
  };

  constructor() {
    this.classifier = simpleNeuralNetwork;
  }

  /**
   * Initialize the neural network system
   */
  async initialize(): Promise<boolean> {
    try {
      devLog('Initializing Neural Network Manager');
      
      // Try to load existing model
      const modelLoaded = await this.classifier.loadModel();
      
      if (modelLoaded) {
        devLog('Existing neural network model loaded successfully');
        return true;
      } else {
        devLog('No existing model found, will need to train');
        return false;
      }
    } catch (error) {
      logError('Initializing neural network manager', error);
      return false;
    }
  }

  /**
   * Train the neural network model
   */
  async trainModel(epochs = 100, autoSave = true): Promise<boolean> {
    if (this.trainingStatus.isTraining) {
      throw new Error('Training already in progress');
    }

    try {
      this.trainingStatus = {
        isTraining: true,
        progress: 0,
        stage: 'preparing_data'
      };

      devLog('Starting neural network training');
      
      // Check if we have enough training data
      const dataCount = await this.getTrainingDataCount();
      if (dataCount.examples < 50) {
        throw new Error(`Insufficient training data. Need at least 50 examples, have ${dataCount.examples}`);
      }

      this.trainingStatus.stage = 'training_model';
      this.trainingStatus.progress = 10;

      // Train the model
      const history = await this.classifier.trainModel(epochs);
      
      this.trainingStatus.progress = 80;
      this.trainingStatus.stage = 'evaluating_model';

      // Evaluate model performance
      const evaluation = await this.classifier.evaluateModel();
      
      this.trainingStatus.accuracy = evaluation.accuracy;
      this.trainingStatus.loss = evaluation.loss;
      this.trainingStatus.progress = 90;

      // Save model if requested
      if (autoSave) {
        this.trainingStatus.stage = 'saving_model';
        await this.classifier.saveModel();
      }

      // Log training completion
      await this.logTrainingEvent('training_completed', {
        accuracy: evaluation.accuracy,
        loss: evaluation.loss,
        epochs,
        trainingExamples: dataCount.examples,
        intents: dataCount.intents
      });

      this.trainingStatus = {
        isTraining: false,
        progress: 100,
        stage: 'completed',
        accuracy: evaluation.accuracy,
        loss: evaluation.loss,
        lastTrainingDate: new Date()
      };

      devLog(`Neural network training completed. Accuracy: ${evaluation.accuracy.toFixed(4)}, Loss: ${evaluation.loss.toFixed(4)}`);
      return true;

    } catch (error) {
      this.trainingStatus = {
        isTraining: false,
        progress: 0,
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      logError('Training neural network', error);
      return false;
    }
  }

  /**
   * Get enhanced intent prediction using neural network
   */
  async getEnhancedPrediction(text: string, useNeuralNetwork = true): Promise<{
    neuralPrediction: IntentPrediction | null;
    topPredictions: IntentPrediction[];
    fallbackUsed: boolean;
  }> {
    let neuralPrediction: IntentPrediction | null = null;
    let topPredictions: IntentPrediction[] = [];
    let fallbackUsed = false;

    try {
      if (useNeuralNetwork && this.classifier.isReady()) {
        // Get primary prediction
        neuralPrediction = await this.classifier.predictIntent(text);
        
        // Get top 3 predictions for context
        topPredictions = await this.classifier.predictTopIntents(text, 3);
        
        // Log the prediction for analytics
        if (neuralPrediction) {
          await this.logPrediction(text, neuralPrediction);
        }
      } else {
        fallbackUsed = true;
        devLog('Neural network not ready, using fallback method');
      }
    } catch (error) {
      logError('Getting neural network prediction', error);
      fallbackUsed = true;
    }

    return {
      neuralPrediction,
      topPredictions,
      fallbackUsed
    };
  }

  /**
   * Retrain model with new data
   */
  async retrainModel(): Promise<boolean> {
    try {
      devLog('Starting model retraining');
      return await this.trainModel(50, true); // Shorter training for retraining
    } catch (error) {
      logError('Retraining neural network model', error);
      return false;
    }
  }

  /**
   * Get training status
   */
  getTrainingStatus(): TrainingStatus {
    return { ...this.trainingStatus };
  }

  /**
   * Get neural network metrics
   */
  async getMetrics(): Promise<NeuralNetworkMetrics | null> {
    try {
      if (!this.classifier.isReady()) {
        return null;
      }

      const evaluation = await this.classifier.evaluateModel();
      const dataCount = await this.getTrainingDataCount();
      
      // Get last training date from logs
      const lastTraining = await prisma.neuralNetworkLog.findFirst({
        where: { eventType: 'training_completed' },
        orderBy: { createdAt: 'desc' }
      });

      return {
        accuracy: evaluation.accuracy,
        loss: evaluation.loss,
        totalTrainingExamples: dataCount.examples,
        totalIntents: dataCount.intents,
        vocabularySize: simpleTextProcessor.getVocabularySize(),
        modelSize: this.getModelSizeString(),
        lastTrainingDate: lastTraining?.createdAt || new Date(),
        isModelLoaded: this.classifier.isReady()
      };
    } catch (error) {
      logError('Getting neural network metrics', error);
      return null;
    }
  }

  /**
   * Add training data and optionally retrain
   */
  async addTrainingData(intentId: string, userInput: string, autoRetrain = false): Promise<boolean> {
    try {
      // Add the training example
      await prisma.trainingExample.create({
        data: {
          intentId,
          userInput,
          keywords: simpleTextProcessor.processText(userInput).stems,
          confidence: 1.0,
          isActive: true
        }
      });

      devLog(`Added training example for intent ${intentId}`);

      // Optionally retrain the model
      if (autoRetrain) {
        return await this.retrainModel();
      }

      return true;
    } catch (error) {
      logError('Adding training data', error);
      return false;
    }
  }

  /**
   * Get training data statistics
   */
  private async getTrainingDataCount(): Promise<{ examples: number; intents: number }> {
    const [examples, intents] = await Promise.all([
      prisma.trainingExample.count({ where: { isActive: true } }),
      prisma.trainingIntent.count({ where: { isActive: true } })
    ]);

    return { examples, intents };
  }

  /**
   * Log training events
   */
  private async logTrainingEvent(eventType: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      await prisma.neuralNetworkLog.create({
        data: {
          eventType,
          metadata: metadata as any,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logError('Logging training event', error);
    }
  }

  /**
   * Log predictions for analytics
   */
  private async logPrediction(text: string, prediction: IntentPrediction): Promise<void> {
    try {
      await prisma.neuralNetworkLog.create({
        data: {
          eventType: 'prediction',
          metadata: {
            text: text.substring(0, 255), // Limit text length
            intentId: prediction.intentId,
            intentName: prediction.intentName,
            confidence: prediction.confidence
          } as any,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logError('Logging prediction', error);
    }
  }

  /**
   * Get model size as human-readable string
   */
  private getModelSizeString(): string {
    if (!this.classifier.isReady()) {
      return 'Unknown';
    }

    const summary = this.classifier.getModelSummary();
    if (summary) {
      // Extract parameter count from summary
      const paramMatch = summary.match(/Total params[:\s]+(\d+)/i);
      if (paramMatch) {
        const params = parseInt(paramMatch[1]);
        if (params > 1000000) {
          return `${(params / 1000000).toFixed(1)}M params`;
        } else if (params > 1000) {
          return `${(params / 1000).toFixed(1)}K params`;
        } else {
          return `${params} params`;
        }
      }
    }

    return 'Unknown';
  }

  /**
   * Check if model needs retraining
   */
  async shouldRetrain(): Promise<boolean> {
    try {
      const lastTraining = await prisma.neuralNetworkLog.findFirst({
        where: { eventType: 'training_completed' },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastTraining) {
        return true; // Never trained
      }

      // Check if new training data has been added since last training
      const newExamples = await prisma.trainingExample.count({
        where: {
          isActive: true,
          createdAt: { gt: lastTraining.createdAt }
        }
      });

      // Retrain if more than 10 new examples added
      return newExamples > 10;
    } catch (error) {
      logError('Checking if model needs retraining', error);
      return false;
    }
  }

  /**
   * Get prediction accuracy statistics
   */
  async getPredictionStats(): Promise<{
    totalPredictions: number;
    averageConfidence: number;
    intentDistribution: Array<{ intentName: string; count: number; avgConfidence: number }>;
  }> {
    try {
      const predictions = await prisma.neuralNetworkLog.findMany({
        where: { eventType: 'prediction' },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Last 1000 predictions
      });

      const totalPredictions = predictions.length;
      
      if (totalPredictions === 0) {
        return {
          totalPredictions: 0,
          averageConfidence: 0,
          intentDistribution: []
        };
      }

      // Calculate average confidence
      const totalConfidence = predictions.reduce((sum, pred) => {
        const confidence = (pred.metadata as any)?.confidence || 0;
        return sum + confidence;
      }, 0);
      const averageConfidence = totalConfidence / totalPredictions;

      // Calculate intent distribution
      const intentMap = new Map<string, { count: number; totalConfidence: number }>();
      
      predictions.forEach(pred => {
        const metadata = pred.metadata as any;
        const intentName = metadata?.intentName || 'Unknown';
        const confidence = metadata?.confidence || 0;
        
        if (!intentMap.has(intentName)) {
          intentMap.set(intentName, { count: 0, totalConfidence: 0 });
        }
        
        const entry = intentMap.get(intentName)!;
        entry.count++;
        entry.totalConfidence += confidence;
      });

      const intentDistribution = Array.from(intentMap.entries()).map(([intentName, data]) => ({
        intentName,
        count: data.count,
        avgConfidence: data.totalConfidence / data.count
      })).sort((a, b) => b.count - a.count);

      return {
        totalPredictions,
        averageConfidence,
        intentDistribution
      };
    } catch (error) {
      logError('Getting prediction statistics', error);
      return {
        totalPredictions: 0,
        averageConfidence: 0,
        intentDistribution: []
      };
    }
  }
}

// Singleton instance
export const neuralNetworkManager = new NeuralNetworkManager();