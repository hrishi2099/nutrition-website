import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { neuralNetworkManager } from '@/lib/neuralNetwork/neuralNetworkManager';
import { logError } from '@/lib/logger';

// Initialize neural network on first request
let initializationPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = neuralNetworkManager.initialize().then(() => {});
  }
  await initializationPromise;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await verifyJWT(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await ensureInitialized();

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const status = neuralNetworkManager.getTrainingStatus();
        return NextResponse.json({ success: true, status });

      case 'metrics':
        const metrics = await neuralNetworkManager.getMetrics();
        return NextResponse.json({ success: true, metrics });

      case 'prediction-stats':
        const predictionStats = await neuralNetworkManager.getPredictionStats();
        return NextResponse.json({ success: true, predictionStats });

      case 'should-retrain':
        const shouldRetrain = await neuralNetworkManager.shouldRetrain();
        return NextResponse.json({ success: true, shouldRetrain });

      default:
        // Return general neural network info
        const generalStatus = neuralNetworkManager.getTrainingStatus();
        const generalMetrics = await neuralNetworkManager.getMetrics();
        
        return NextResponse.json({
          success: true,
          status: generalStatus,
          metrics: generalMetrics,
          isInitialized: true
        });
    }
  } catch (error) {
    logError('Neural network API GET', error);
    return NextResponse.json(
      { error: 'Failed to get neural network information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await verifyJWT(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await ensureInitialized();

    const body = await request.json();
    const { action, epochs, intentId, userInput } = body;

    switch (action) {
      case 'train':
        const trainingEpochs = epochs || 100;
        const trainingSuccess = await neuralNetworkManager.trainModel(trainingEpochs, true);
        
        if (trainingSuccess) {
          return NextResponse.json({
            success: true,
            message: 'Neural network training completed successfully'
          });
        } else {
          const status = neuralNetworkManager.getTrainingStatus();
          return NextResponse.json({
            success: false,
            error: status.error || 'Training failed',
            status
          }, { status: 400 });
        }

      case 'retrain':
        const retrainingSuccess = await neuralNetworkManager.retrainModel();
        
        if (retrainingSuccess) {
          return NextResponse.json({
            success: true,
            message: 'Neural network retraining completed successfully'
          });
        } else {
          const status = neuralNetworkManager.getTrainingStatus();
          return NextResponse.json({
            success: false,
            error: status.error || 'Retraining failed',
            status
          }, { status: 400 });
        }

      case 'add-training-data':
        if (!intentId || !userInput) {
          return NextResponse.json({
            error: 'Intent ID and user input are required'
          }, { status: 400 });
        }

        const addSuccess = await neuralNetworkManager.addTrainingData(
          intentId,
          userInput,
          false // Don't auto-retrain
        );

        if (addSuccess) {
          return NextResponse.json({
            success: true,
            message: 'Training data added successfully'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to add training data'
          }, { status: 400 });
        }

      case 'predict':
        if (!userInput) {
          return NextResponse.json({
            error: 'User input is required for prediction'
          }, { status: 400 });
        }

        const prediction = await neuralNetworkManager.getEnhancedPrediction(userInput, true);
        return NextResponse.json({
          success: true,
          prediction
        });

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    logError('Neural network API POST', error);
    return NextResponse.json(
      { error: 'Failed to perform neural network operation' },
      { status: 500 }
    );
  }
}