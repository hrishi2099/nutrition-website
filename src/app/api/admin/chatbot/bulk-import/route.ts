import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/adminAuth';
import { Prisma } from '@prisma/client';

interface ImportIntent {
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
    conditions?: Record<string, unknown>;
    variables?: Record<string, unknown>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intents } = await request.json();
    
    if (!Array.isArray(intents)) {
      return NextResponse.json({ error: 'Intents must be an array' }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as string[]
    };

    for (const [index, intentData] of intents.entries()) {
      const typedIntentData = intentData as ImportIntent;
      try {
        // Validate required fields
        if (!typedIntentData.intent || !typedIntentData.category) {
          results.errors.push(`Intent ${index + 1}: Missing required fields (intent, category)`);
          continue;
        }

        // Check if intent already exists
        const existingIntent = await prisma.trainingIntent.findFirst({
          where: { name: typedIntentData.intent }
        });

        if (existingIntent) {
          results.errors.push(`Intent ${index + 1}: Intent '${typedIntentData.intent}' already exists`);
          continue;
        }

        // Use transaction for all related operations
        await prisma.$transaction(async (tx) => {
          // Create the intent
          const createdIntent = await tx.trainingIntent.create({
            data: {
              name: typedIntentData.intent,
              description: typedIntentData.description || null,
              category: typedIntentData.category,
              priority: typedIntentData.priority || 0,
              isActive: true
            }
          });

          // Add examples
          if (typedIntentData.examples && Array.isArray(typedIntentData.examples)) {
            for (const example of typedIntentData.examples) {
              if (example.userInput) {
                // Extract keywords from user input
                const keywords = example.userInput
                  .toLowerCase()
                  .replace(/[^\w\s]/g, ' ')
                  .split(/\s+/)
                  .filter(word => word.length > 2)
                  .slice(0, 15);

                await tx.trainingExample.create({
                  data: {
                    intentId: createdIntent.id,
                    userInput: example.userInput,
                    keywords: keywords,
                    confidence: example.confidence || 1.0,
                    isActive: true
                  }
                });
              }
            }
          }

          // Add responses
          if (typedIntentData.responses && Array.isArray(typedIntentData.responses)) {
            for (const response of typedIntentData.responses) {
              if (response.response) {
                await tx.trainingResponse.create({
                  data: {
                    intentId: createdIntent.id,
                    response: response.response,
                    responseType: response.responseType || 'text',
                    priority: response.priority || 0,
                    conditions: response.conditions ? (response.conditions as Prisma.InputJsonValue) : undefined,
                    variables: response.variables ? (response.variables as Prisma.InputJsonValue) : undefined,
                    isActive: true,
                    usageCount: 0
                  }
                });
              }
            }
          }
        });

        results.success++;
      } catch (error) {
        console.error(`Error importing intent ${index + 1}:`, error);
        results.errors.push(`Intent ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}