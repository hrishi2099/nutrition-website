import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ImportIntent {
  name: string;
  description: string;
  category: string;
  priority: number;
  examples: Array<{
    userInput: string;
    keywords: string[];
    confidence: number;
  }>;
  responses: Array<{
    response: string;
    responseType: string;
    priority: number;
  }>;
}

async function importIndianDietIntents() {
  try {
    const jsonPath = path.join(process.cwd(), 'indian-diet-intents.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Importing ${jsonData.intents.length} Indian diet intents...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const intentData of jsonData.intents) {
      try {
        // Check if intent already exists
        const existingIntent = await prisma.trainingIntent.findUnique({
          where: { name: intentData.name }
        });
        
        if (existingIntent) {
          console.log(`Intent '${intentData.name}' already exists, skipping...`);
          continue;
        }
        
        // Create the intent
        const intent = await prisma.trainingIntent.create({
          data: {
            name: intentData.name,
            description: intentData.description,
            category: intentData.category,
            priority: intentData.priority,
            isActive: true
          }
        });
        
        // Create examples
        for (const example of intentData.examples) {
          await prisma.trainingExample.create({
            data: {
              intentId: intent.id,
              userInput: example.userInput,
              keywords: example.keywords,
              confidence: example.confidence,
              isActive: true
            }
          });
        }
        
        // Create responses
        for (const response of intentData.responses) {
          await prisma.trainingResponse.create({
            data: {
              intentId: intent.id,
              response: response.response,
              responseType: response.responseType,
              priority: response.priority,
              isActive: true
            }
          });
        }
        
        successCount++;
        console.log(`✓ Successfully imported intent: ${intentData.name}`);
        
      } catch (error) {
        errorCount++;
        console.error(`✗ Error importing intent '${intentData.name}':`, error);
      }
    }
    
    console.log(`\nImport completed:`);
    console.log(`- Successfully imported: ${successCount} intents`);
    console.log(`- Errors: ${errorCount} intents`);
    
  } catch (error) {
    console.error('Error importing intents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importIndianDietIntents();