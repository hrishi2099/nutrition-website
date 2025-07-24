import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken } from '@/lib/admin-auth';

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
    conditions?: Record<string, any>;
    variables?: Record<string, any>;
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
      try {
        // Validate required fields
        if (!intentData.intent || !intentData.category) {
          results.errors.push(`Intent ${index + 1}: Missing required fields (intent, category)`);
          continue;
        }

        // Check if intent already exists
        const existingIntent = await prisma.trainingIntent.findFirst({
          where: { name: intentData.intent }
        });

        if (existingIntent) {
          results.errors.push(`Intent ${index + 1}: Intent '${intentData.intent}' already exists`);
          continue;
        }

        // Create the intent
        const createdIntent = await prisma.trainingIntent.create({
          data: {
            name: intentData.intent,
            description: intentData.description || null,
            category: intentData.category,
            priority: intentData.priority || 0,
            isActive: true
          }
        });

        // Add examples
        if (intentData.examples && Array.isArray(intentData.examples)) {
          for (const example of intentData.examples) {
            if (example.userInput) {
              // Extract keywords from user input
              const keywords = example.userInput
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2)
                .slice(0, 15);

              await prisma.trainingExample.create({
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
        if (intentData.responses && Array.isArray(intentData.responses)) {
          for (const response of intentData.responses) {
            if (response.response) {
              await prisma.trainingResponse.create({
                data: {
                  intentId: createdIntent.id,
                  response: response.response,
                  responseType: response.responseType || 'text',
                  priority: response.priority || 0,
                  conditions: response.conditions || null,
                  variables: response.variables || null,
                  isActive: true,
                  usageCount: 0
                }
              });
            }
          }
        }

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