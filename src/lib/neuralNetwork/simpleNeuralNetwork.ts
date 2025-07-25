import { SimpleTextProcessor, simpleTextProcessor } from './simpleTextProcessor';
import { prisma } from '@/lib/prisma';
import { devLog, logError } from '@/lib/logger';

export interface IntentPrediction {
  intentId: string;
  intentName: string;
  confidence: number;
  features: number[];
}

export interface TrainingData {
  texts: string[];
  labels: string[];
  intentMap: Map<string, number>;
}

/**
 * Simple Neural Network implementation using mathematical similarity
 * This is more suitable for server-side deployment than TensorFlow.js
 */
export class SimpleNeuralNetwork {
  private weights: number[][] = [];
  private biases: number[] = [];
  private intentMap: Map<string, number> = new Map();
  private reverseIntentMap: Map<number, string> = new Map();
  private isModelTrained = false;
  private textProcessor: SimpleTextProcessor;
  private learningRate = 0.01;
  private epochs = 1000;

  constructor() {
    this.textProcessor = simpleTextProcessor;
  }

  /**
   * Load training data from database
   */
  async loadTrainingData(): Promise<TrainingData> {
    try {
      const intents = await prisma.trainingIntent.findMany({
        where: { isActive: true },
        include: {
          examples: {
            where: { isActive: true }
          }
        }
      });

      const texts: string[] = [];
      const labels: string[] = [];
      const intentMap = new Map<string, number>();

      // Build intent mapping
      intents.forEach((intent, index) => {
        intentMap.set(intent.id, index);
      });

      // Collect training examples
      intents.forEach(intent => {
        intent.examples.forEach(example => {
          texts.push(example.userInput);
          labels.push(intent.id);
        });
      });

      devLog(`Loaded ${texts.length} training examples for ${intents.length} intents`);

      return { texts, labels, intentMap };
    } catch (error) {
      logError('Loading training data', error);
      throw error;
    }
  }

  /**
   * Initialize neural network weights
   */
  private initializeWeights(inputSize: number, outputSize: number): void {
    // Initialize weights with small random values
    this.weights = [];
    for (let i = 0; i < outputSize; i++) {
      this.weights[i] = [];
      for (let j = 0; j < inputSize; j++) {
        this.weights[i][j] = (Math.random() - 0.5) * 0.1;
      }
    }

    // Initialize biases
    this.biases = new Array(outputSize).fill(0).map(() => (Math.random() - 0.5) * 0.1);
  }

  /**
   * Activation function (sigmoid)
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }

  /**
   * Softmax activation for output layer
   */
  private softmax(inputs: number[]): number[] {
    const maxInput = Math.max(...inputs);
    const expInputs = inputs.map(x => Math.exp(x - maxInput));
    const sumExp = expInputs.reduce((sum, exp) => sum + exp, 0);
    return expInputs.map(exp => exp / sumExp);
  }

  /**
   * Forward pass through the network
   */
  private forward(input: number[]): number[] {
    const outputs: number[] = [];
    
    for (let i = 0; i < this.weights.length; i++) {
      let sum = this.biases[i];
      for (let j = 0; j < input.length; j++) {
        sum += this.weights[i][j] * input[j];
      }
      outputs.push(sum);
    }

    return this.softmax(outputs);
  }

  /**
   * Train the neural network
   */
  async trainModel(epochs = 1000): Promise<{ accuracy: number; loss: number }> {
    try {
      const trainingData = await this.loadTrainingData();
      
      if (trainingData.texts.length === 0) {
        throw new Error('No training data available');
      }

      // Build vocabulary and prepare data
      this.textProcessor.buildVocabulary(trainingData.texts);
      const featureMatrix = this.textProcessor.textsToMatrix(trainingData.texts);
      
      // Prepare labels
      const numClasses = trainingData.intentMap.size;
      const labelMatrix = trainingData.labels.map(label => {
        const oneHot = new Array(numClasses).fill(0);
        const index = trainingData.intentMap.get(label);
        if (index !== undefined) {
          oneHot[index] = 1;
        }
        return oneHot;
      });

      // Store mappings
      this.intentMap = trainingData.intentMap;
      trainingData.intentMap.forEach((index, intentId) => {
        this.reverseIntentMap.set(index, intentId);
      });

      // Initialize weights
      const inputSize = this.textProcessor.getVocabularySize();
      this.initializeWeights(inputSize, numClasses);

      let totalLoss = 0;
      let correctPredictions = 0;

      // Training loop
      for (let epoch = 0; epoch < epochs; epoch++) {
        let epochLoss = 0;
        let epochCorrect = 0;

        for (let i = 0; i < featureMatrix.length; i++) {
          const input = featureMatrix[i];
          const target = labelMatrix[i];

          // Forward pass
          const output = this.forward(input);

          // Calculate loss (cross-entropy)
          let loss = 0;
          for (let j = 0; j < output.length; j++) {
            if (target[j] === 1) {
              loss -= Math.log(Math.max(1e-15, output[j]));
            }
          }
          epochLoss += loss;

          // Check if prediction is correct
          const predictedIndex = output.indexOf(Math.max(...output));
          const actualIndex = target.indexOf(1);
          if (predictedIndex === actualIndex) {
            epochCorrect++;
          }

          // Backward pass (gradient descent)
          const errors = output.map((o, j) => o - target[j]);

          // Update weights and biases
          for (let j = 0; j < this.weights.length; j++) {
            this.biases[j] -= this.learningRate * errors[j];
            for (let k = 0; k < this.weights[j].length; k++) {
              this.weights[j][k] -= this.learningRate * errors[j] * input[k];
            }
          }
        }

        totalLoss = epochLoss / featureMatrix.length;
        correctPredictions = epochCorrect;

        if (epoch % 100 === 0) {
          const accuracy = correctPredictions / featureMatrix.length;
          devLog(`Epoch ${epoch}: Loss=${totalLoss.toFixed(4)}, Accuracy=${(accuracy * 100).toFixed(2)}%`);
        }
      }

      this.isModelTrained = true;
      const finalAccuracy = correctPredictions / featureMatrix.length;
      
      devLog(`Training completed. Final accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
      
      return { accuracy: finalAccuracy, loss: totalLoss };
    } catch (error) {
      logError('Training neural network model', error);
      throw error;
    }
  }

  /**
   * Predict intent for given text
   */
  async predictIntent(text: string): Promise<IntentPrediction | null> {
    if (!this.isModelTrained || this.weights.length === 0) {
      return null;
    }

    try {
      const processed = this.textProcessor.processText(text);
      const output = this.forward(processed.features);

      // Get the highest confidence prediction
      let maxIndex = 0;
      let maxConfidence = output[0];

      for (let i = 1; i < output.length; i++) {
        if (output[i] > maxConfidence) {
          maxConfidence = output[i];
          maxIndex = i;
        }
      }

      // Get intent information
      const intentId = this.reverseIntentMap.get(maxIndex);
      if (!intentId) {
        return null;
      }

      // Get intent name from database
      const intent = await prisma.trainingIntent.findUnique({
        where: { id: intentId }
      });

      if (!intent) {
        return null;
      }

      return {
        intentId,
        intentName: intent.name,
        confidence: maxConfidence,
        features: processed.features
      };
    } catch (error) {
      logError('Predicting intent with neural network', error);
      return null;
    }
  }

  /**
   * Predict multiple intents with confidence scores
   */
  async predictTopIntents(text: string, topK = 3): Promise<IntentPrediction[]> {
    if (!this.isModelTrained || this.weights.length === 0) {
      return [];
    }

    try {
      const processed = this.textProcessor.processText(text);
      const output = this.forward(processed.features);

      // Get top K predictions
      const predictions: Array<{ index: number; confidence: number }> = [];
      for (let i = 0; i < output.length; i++) {
        predictions.push({ index: i, confidence: output[i] });
      }

      predictions.sort((a, b) => b.confidence - a.confidence);
      const topPredictions = predictions.slice(0, topK);

      // Convert to IntentPrediction format
      const results: IntentPrediction[] = [];
      for (const pred of topPredictions) {
        const intentId = this.reverseIntentMap.get(pred.index);
        if (intentId) {
          const intent = await prisma.trainingIntent.findUnique({
            where: { id: intentId }
          });

          if (intent) {
            results.push({
              intentId,
              intentName: intent.name,
              confidence: pred.confidence,
              features: processed.features
            });
          }
        }
      }

      return results;
    } catch (error) {
      logError('Predicting top intents with neural network', error);
      return [];
    }
  }

  /**
   * Save model weights and metadata
   */
  async saveModel(): Promise<void> {
    if (!this.isModelTrained) {
      throw new Error('No trained model to save');
    }

    try {
      const modelData = {
        weights: this.weights,
        biases: this.biases,
        vocabulary: this.textProcessor.exportVocabulary(),
        intentMap: Object.fromEntries(this.intentMap),
        reverseIntentMap: Object.fromEntries(this.reverseIntentMap),
        isModelTrained: this.isModelTrained
      };

      // Store model in database
      await prisma.neuralNetworkLog.create({
        data: {
          eventType: 'model_weights',
          metadata: modelData
        }
      });
      
      devLog('Model saved successfully');
    } catch (error) {
      logError('Saving neural network model', error);
      throw error;
    }
  }

  /**
   * Load model weights and metadata
   */
  async loadModel(): Promise<boolean> {
    try {
      // Load model from database
      const modelLog = await prisma.neuralNetworkLog.findFirst({
        where: { eventType: 'model_weights' },
        orderBy: { createdAt: 'desc' }
      });

      if (!modelLog || !modelLog.metadata) {
        devLog('No saved model found');
        return false;
      }

      const modelData = modelLog.metadata as any;
      
      // Restore model state
      this.weights = modelData.weights || [];
      this.biases = modelData.biases || [];
      this.isModelTrained = modelData.isModelTrained || false;
      
      // Restore mappings
      if (modelData.vocabulary) {
        this.textProcessor.importVocabulary(modelData.vocabulary);
      }
      if (modelData.intentMap) {
        this.intentMap = new Map(Object.entries(modelData.intentMap).map(([k, v]) => [k, v as number]));
      }
      if (modelData.reverseIntentMap) {
        this.reverseIntentMap = new Map(Object.entries(modelData.reverseIntentMap).map(([k, v]) => [Number(k), v as string]));
      }

      devLog('Model loaded successfully');
      return true;
    } catch (error) {
      devLog('Failed to load model');
      return false;
    }
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(): Promise<{ accuracy: number; loss: number }> {
    if (!this.isModelTrained) {
      throw new Error('Model not trained');
    }

    try {
      const trainingData = await this.loadTrainingData();
      const featureMatrix = this.textProcessor.textsToMatrix(trainingData.texts);
      
      // Prepare labels
      const numClasses = this.intentMap.size;
      const labelMatrix = trainingData.labels.map(label => {
        const oneHot = new Array(numClasses).fill(0);
        const index = this.intentMap.get(label);
        if (index !== undefined) {
          oneHot[index] = 1;
        }
        return oneHot;
      });

      let totalLoss = 0;
      let correctPredictions = 0;

      for (let i = 0; i < featureMatrix.length; i++) {
        const input = featureMatrix[i];
        const target = labelMatrix[i];
        const output = this.forward(input);

        // Calculate loss
        let loss = 0;
        for (let j = 0; j < output.length; j++) {
          if (target[j] === 1) {
            loss -= Math.log(Math.max(1e-15, output[j]));
          }
        }
        totalLoss += loss;

        // Check accuracy
        const predictedIndex = output.indexOf(Math.max(...output));
        const actualIndex = target.indexOf(1);
        if (predictedIndex === actualIndex) {
          correctPredictions++;
        }
      }

      return {
        accuracy: correctPredictions / featureMatrix.length,
        loss: totalLoss / featureMatrix.length
      };
    } catch (error) {
      logError('Evaluating neural network model', error);
      throw error;
    }
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isModelTrained && this.weights.length > 0;
  }

  /**
   * Get model summary
   */
  getModelSummary(): string {
    if (!this.isReady()) {
      return 'Model not trained';
    }

    const inputSize = this.textProcessor.getVocabularySize();
    const outputSize = this.weights.length;
    const totalParams = this.weights.flat().length + this.biases.length;

    return `Simple Neural Network:
Input Size: ${inputSize}
Output Size: ${outputSize}
Total Parameters: ${totalParams}
Vocabulary Size: ${this.textProcessor.getVocabularySize()}
Intents: ${this.intentMap.size}`;
  }
}

// Singleton instance
export const simpleNeuralNetwork = new SimpleNeuralNetwork();