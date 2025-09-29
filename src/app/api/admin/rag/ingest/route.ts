// Admin API for RAG Knowledge Ingestion
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { knowledgeIngestion } from '@/lib/rag/knowledgeIngestion';
import { localNutritionRAG } from '@/lib/rag/localRAG';
import { devLog, logError } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// POST: Full knowledge base ingestion
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { type } = await request.json();

    let result;

    switch (type) {
      case 'full':
        result = await knowledgeIngestion.ingestAllKnowledge();
        break;

      case 'nutrition_facts':
        result = await knowledgeIngestion.ingestNutritionFacts();
        break;

      case 'food_database':
        result = await knowledgeIngestion.ingestFoodDatabase();
        break;

      case 'recipes':
        result = await knowledgeIngestion.ingestRecipes();
        break;

      case 'research_papers':
        result = await knowledgeIngestion.ingestResearchPapers();
        break;

      case 'supplements':
        result = await knowledgeIngestion.ingestSupplementInfo();
        break;

      case 'meal_plans':
        result = await knowledgeIngestion.ingestMealPlans();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid ingestion type' },
          { status: 400 }
        );
    }

    devLog(`Admin RAG ingestion completed: ${type}`, { result });

    return NextResponse.json({
      success: true,
      message: 'Knowledge ingestion completed',
      result
    });

  } catch (error) {
    logError('Admin RAG ingestion', error);
    return NextResponse.json(
      { error: 'Failed to ingest knowledge' },
      { status: 500 }
    );
  }
}

// GET: Get ingestion status
export async function GET() {
  try {
    const isAdmin = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const status = await knowledgeIngestion.getIngestionStatus();
    const collectionStats = await localNutritionRAG.getCollectionStats();

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        collectionName: collectionStats.collectionName,
        isInitialized: collectionStats.totalDocuments > 0
      }
    });

  } catch (error) {
    logError('Getting RAG status', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

// DELETE: Clear knowledge base
export async function DELETE() {
  try {
    const isAdmin = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await localNutritionRAG.clearCollection();

    devLog('Admin cleared RAG knowledge base');

    return NextResponse.json({
      success: true,
      message: 'Knowledge base cleared successfully'
    });

  } catch (error) {
    logError('Clearing RAG knowledge base', error);
    return NextResponse.json(
      { error: 'Failed to clear knowledge base' },
      { status: 500 }
    );
  }
}

async function verifyAdminAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return false;
    }

    const { payload } = await verifyJWT(token);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    return user?.role === 'ADMIN';
  } catch (error) {
    logError('Admin verification', error);
    return false;
  }
}