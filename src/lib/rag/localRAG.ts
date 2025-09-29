// Local RAG Implementation without GPT-4
// Uses HuggingFace transformers and local vector database

import { HfInference } from '@huggingface/inference';
import { ChromaClient } from 'chromadb';
import { devLog, logError } from '@/lib/logger';
import { InMemoryVectorStore } from './inMemoryStore';
import { fileStore } from './fileStore';

// Initialize HuggingFace for embeddings (free tier available)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Initialize ChromaDB (local vector database)
let chroma: ChromaClient | null = null;
try {
  chroma = new ChromaClient({
    path: process.env.CHROMA_DB_PATH || "http://localhost:8000"
  });
} catch (error) {
  logError('ChromaDB initialization', error);
}

export interface NutritionDocument {
  id: string;
  content: string;
  metadata: {
    type: 'nutrition_fact' | 'food_data' | 'recipe' | 'research_paper' | 'meal_plan' | 'supplement_info';
    title: string;
    source: string;
    tags: string[];
    calories?: number;
    macros?: {
      protein: number;
      carbs: number;
      fat: number;
    };
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    goals?: ('weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health')[];
    lastUpdated: string;
    credibilityScore: number; // 0-1 based on source reliability
  };
}

export interface RAGSearchResult {
  documents: NutritionDocument[];
  similarity_scores: number[];
  search_time_ms: number;
  total_results: number;
}

export class LocalNutritionRAG {
  private collectionName = 'nutrition-knowledge';
  private collection: any = null;
  private inMemoryStore: InMemoryVectorStore;
  private useInMemory = false;
  private useFileStore = false;

  // Alternative embedding models (free/local options)
  private embeddingModels = {
    // HuggingFace models (free tier)
    'sentence-transformers': 'sentence-transformers/all-MiniLM-L6-v2', // Fast, good for general text
    'nutrition-specialized': 'sentence-transformers/all-mpnet-base-v2', // Better quality
    // Local models (can be run offline)
    'local-sentence-transformer': 'sentence-transformers/paraphrase-MiniLM-L6-v2'
  };

  private currentModel = this.embeddingModels['sentence-transformers'];

  constructor() {
    this.inMemoryStore = new InMemoryVectorStore();
  }

  async initialize(): Promise<void> {
    try {
      if (!chroma) {
        devLog('ChromaDB not available, using in-memory vector store');
        this.useInMemory = true;
        await this.inMemoryStore.initialize();
        devLog('Local RAG initialized with in-memory store');
        return;
      }

      // Try to use ChromaDB
      try {
        this.collection = await chroma.getCollection({
          name: this.collectionName
        });
        devLog('Connected to existing ChromaDB collection');
      } catch {
        // Collection doesn't exist, create it
        this.collection = await chroma.createCollection({
          name: this.collectionName,
          metadata: { description: 'Nutrition knowledge base for RAG' }
        });
        devLog('Created new ChromaDB collection');
      }

      devLog('Local RAG initialized with ChromaDB');
    } catch (error) {
      logError('Local RAG initialization with ChromaDB failed, falling back to file store', error);
      this.useFileStore = true;
      await fileStore.initialize();
      devLog('Local RAG initialized with file-based store');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Option 1: HuggingFace API (free tier)
      if (process.env.HUGGINGFACE_API_KEY) {
        const response = await hf.featureExtraction({
          model: this.currentModel,
          inputs: text.replace(/\n/g, ' ').substring(0, 512), // Limit for performance
        });

        // Handle different response formats
        if (Array.isArray(response) && Array.isArray(response[0])) {
          return response[0] as number[];
        } else if (Array.isArray(response)) {
          return response as number[];
        } else {
          throw new Error('Unexpected embedding response format');
        }
      }

      // Option 2: Local embedding fallback (using simple TF-IDF)
      return this.generateLocalEmbedding(text);

    } catch (error) {
      logError('Embedding generation', error);
      // Fallback to local embedding
      return this.generateLocalEmbedding(text);
    }
  }

  private generateLocalEmbedding(text: string): number[] {
    // Simple TF-IDF based embedding for fallback
    // This is a basic implementation - in production, use proper sentence transformers

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Nutrition-specific vocabulary for better embeddings
    const nutritionVocab = [
      'protein', 'carbohydrate', 'fat', 'calorie', 'vitamin', 'mineral',
      'nutrition', 'diet', 'healthy', 'meal', 'food', 'supplement',
      'weight', 'loss', 'gain', 'muscle', 'fiber', 'sodium', 'sugar',
      'organic', 'exercise', 'metabolism', 'energy', 'antioxidant'
    ];

    // Create fixed-size embedding vector (384 dimensions like MiniLM)
    const embedding = new Array(384).fill(0);

    // Calculate word frequencies
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Map nutrition vocabulary to embedding dimensions
    nutritionVocab.forEach((vocabWord, index) => {
      const count = wordCounts.get(vocabWord) || 0;
      if (count > 0) {
        const tf = count / words.length;
        const position = (index * 16) % 384; // Distribute across embedding space
        embedding[position] = tf;

        // Add some randomization for better distribution
        for (let i = 1; i < 4; i++) {
          if (position + i < 384) {
            embedding[position + i] = tf * (1 - i * 0.2);
          }
        }
      }
    });

    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }

    return embedding;
  }

  async addDocument(document: NutritionDocument): Promise<void> {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(document.content);

      if (this.useFileStore) {
        await fileStore.addDocument(document, embedding);
      } else if (this.useInMemory) {
        await this.inMemoryStore.addDocument(document, embedding);
      } else {
        if (!this.collection) {
          throw new Error('Collection not initialized');
        }

        // Add to ChromaDB
        await this.collection.add({
          ids: [document.id],
          embeddings: [embedding],
          metadatas: [document.metadata],
          documents: [document.content]
        });
      }

      devLog(`Added document to Local RAG: ${document.id}`);
    } catch (error) {
      logError('Adding document to Local RAG', error, { documentId: document.id });
      throw error;
    }
  }

  async addDocumentsBatch(documents: NutritionDocument[]): Promise<void> {
    try {
      const batchSize = 50; // Reasonable batch size for local processing

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        // Generate embeddings for batch
        const embeddings = await Promise.all(
          batch.map(doc => this.generateEmbedding(doc.content))
        );

        if (this.useInMemory) {
          await this.inMemoryStore.addDocumentsBatch(batch, embeddings);
        } else {
          if (!this.collection) {
            throw new Error('Collection not initialized');
          }

          // Add batch to ChromaDB
          await this.collection.add({
            ids: batch.map(doc => doc.id),
            embeddings: embeddings,
            metadatas: batch.map(doc => doc.metadata),
            documents: batch.map(doc => doc.content)
          });
        }

        devLog(`Added batch ${Math.floor(i/batchSize) + 1} to Local RAG (${batch.length} documents)`);
      }
    } catch (error) {
      logError('Adding document batch to Local RAG', error);
      throw error;
    }
  }

  async searchSimilar(
    query: string,
    options: {
      topK?: number;
      filter?: Record<string, unknown>;
      minSimilarity?: number;
    } = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();

    try {
      const {
        topK = 5,
        filter = {},
        minSimilarity = 0.5 // Lower threshold for local embeddings
      } = options;

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      if (this.useFileStore) {
        return await fileStore.search(queryEmbedding, topK, minSimilarity);
      } else if (this.useInMemory) {
        return await this.inMemoryStore.searchSimilar(queryEmbedding, options);
      } else {
        if (!this.collection) {
          throw new Error('Collection not initialized');
        }

        // Search in ChromaDB
        const results = await this.collection.query({
          queryEmbeddings: [queryEmbedding],
          nResults: topK,
          where: Object.keys(filter).length > 0 ? filter : undefined,
          include: ['metadatas', 'documents', 'distances']
        });

        // Process results
        const documents: NutritionDocument[] = [];
        const similarityScores: number[] = [];

        if (results.ids && results.ids[0] && results.metadatas && results.documents && results.distances) {
          const ids = results.ids[0];
          const metadatas = results.metadatas[0];
          const docs = results.documents[0];
          const distances = results.distances[0];

          for (let i = 0; i < ids.length; i++) {
            // Convert distance to similarity score
            const similarity = 1 - distances[i];

            if (similarity >= minSimilarity && metadatas[i] && docs[i]) {
              const metadata = metadatas[i] as NutritionDocument['metadata'];

              documents.push({
                id: ids[i],
                content: docs[i],
                metadata: metadata,
              });

              similarityScores.push(similarity);
            }
          }
        }

        const searchTime = Date.now() - startTime;

        devLog(`Local RAG search completed: ${documents.length} results in ${searchTime}ms`);

        return {
          documents,
          similarity_scores: similarityScores,
          search_time_ms: searchTime,
          total_results: documents.length,
        };
      }
    } catch (error) {
      logError('Local RAG search', error, { query: query.substring(0, 100) });
      throw error;
    }
  }

  async searchByType(
    query: string,
    documentType: NutritionDocument['metadata']['type'],
    topK = 3
  ): Promise<RAGSearchResult> {
    return this.searchSimilar(query, {
      topK,
      filter: { type: documentType },
    });
  }

  async getRelevantContext(
    query: string,
    userContext?: {
      goals?: string[];
      dietaryRestrictions?: string[];
      activityLevel?: string;
      enrolledPlan?: string;
    },
    maxTokens = 2000
  ): Promise<string> {
    try {
      const searchPromises: Promise<RAGSearchResult>[] = [
        // General nutrition search
        this.searchSimilar(query, { topK: 3, minSimilarity: 0.6 }),
      ];

      // Add goal-specific searches
      if (userContext?.goals && userContext.goals.length > 0) {
        searchPromises.push(
          this.searchSimilar(query, {
            topK: 2,
            filter: { goals: { $in: userContext.goals } }
          })
        );
      }

      // Search specific document types based on query keywords
      const queryLower = query.toLowerCase();

      if (queryLower.includes('recipe') || queryLower.includes('meal') || queryLower.includes('cook')) {
        searchPromises.push(this.searchByType(query, 'recipe', 2));
      }

      if (queryLower.includes('supplement') || queryLower.includes('vitamin') || queryLower.includes('mineral')) {
        searchPromises.push(this.searchByType(query, 'supplement_info', 2));
      }

      if (queryLower.includes('calories') || queryLower.includes('nutrition') || queryLower.includes('macro')) {
        searchPromises.push(this.searchByType(query, 'food_data', 2));
      }

      if (queryLower.includes('research') || queryLower.includes('study') || queryLower.includes('evidence')) {
        searchPromises.push(this.searchByType(query, 'research_paper', 1));
      }

      const allResults = await Promise.all(searchPromises);

      // Combine and deduplicate results
      const allDocuments: NutritionDocument[] = [];
      const seenIds = new Set<string>();

      for (const result of allResults) {
        for (const doc of result.documents) {
          if (!seenIds.has(doc.id)) {
            allDocuments.push(doc);
            seenIds.add(doc.id);
          }
        }
      }

      // Sort by credibility score and relevance
      allDocuments.sort((a, b) =>
        b.metadata.credibilityScore - a.metadata.credibilityScore
      );

      // Format context for local LLM or rule-based system
      if (allDocuments.length === 0) {
        return '';
      }

      let context = 'RELEVANT NUTRITION KNOWLEDGE:\n\n';
      let tokenCount = 0;
      const maxTokensPerDoc = Math.floor(maxTokens / Math.min(allDocuments.length, 5));

      for (const doc of allDocuments.slice(0, 5)) {
        const docText = `${doc.metadata.title} (${doc.metadata.type}):\n${doc.content}\n\n`;

        // Rough token estimation (1 token ≈ 4 characters)
        const docTokens = Math.ceil(docText.length / 4);

        if (tokenCount + docTokens > maxTokens) {
          // Truncate to fit
          const remainingChars = (maxTokens - tokenCount) * 4;
          if (remainingChars > 100) { // Only include if meaningful length
            context += docText.substring(0, remainingChars) + '...\n\n';
          }
          break;
        }

        context += docText;
        tokenCount += docTokens;
      }

      return context.trim();
    } catch (error) {
      logError('Getting relevant context from Local RAG', error);
      return '';
    }
  }

  async generateResponse(
    query: string,
    context: string,
    userContext?: {
      firstName?: string;
      goals?: string[];
      enrolledPlan?: string;
    }
  ): Promise<string> {
    // Since we're not using GPT-4, we'll use rule-based response generation
    // enhanced with the RAG context

    const userName = userContext?.firstName || '';
    const greeting = userName ? `Hi ${userName}! ` : '';

    // Extract key information from context
    const contextLines = context.split('\n').filter(line => line.trim().length > 0);
    const relevantFacts: string[] = [];

    for (const line of contextLines) {
      if (line.includes('calories') || line.includes('protein') || line.includes('carb') || line.includes('fat')) {
        relevantFacts.push(line.trim());
      }
    }

    // Generate response based on query type and context
    let response = greeting;

    if (query.toLowerCase().includes('calories') || query.toLowerCase().includes('nutrition')) {
      response += "Based on our nutrition database:\n\n";

      if (relevantFacts.length > 0) {
        response += relevantFacts.slice(0, 3).map(fact => `• ${fact}`).join('\n') + '\n\n';
      }

      response += "For personalized calorie recommendations, consider your activity level, age, and health goals.";
    } else if (query.toLowerCase().includes('recipe') || query.toLowerCase().includes('meal')) {
      response += "Here are some meal suggestions from our database:\n\n";

      // Extract recipe information from context
      const recipeInfo = contextLines.filter(line =>
        line.includes('recipe') || line.includes('meal') || line.includes('cook')
      );

      if (recipeInfo.length > 0) {
        response += recipeInfo.slice(0, 2).map(info => `• ${info}`).join('\n') + '\n\n';
      }

      response += "Would you like specific cooking instructions or nutritional breakdown for any of these?";
    } else if (query.toLowerCase().includes('supplement') || query.toLowerCase().includes('vitamin')) {
      response += "Based on supplement research:\n\n";

      const supplementInfo = contextLines.filter(line =>
        line.includes('supplement') || line.includes('vitamin') || line.includes('mineral')
      );

      if (supplementInfo.length > 0) {
        response += supplementInfo.slice(0, 3).map(info => `• ${info}`).join('\n') + '\n\n';
      }

      response += "Always consult with a healthcare provider before starting new supplements.";
    } else {
      // General nutrition response
      response += "Based on our nutrition knowledge base:\n\n";

      if (contextLines.length > 0) {
        // Take the most relevant lines
        const topLines = contextLines
          .filter(line => line.length > 20) // Filter out short lines
          .slice(0, 4);

        response += topLines.map(line => `• ${line}`).join('\n') + '\n\n';
      }

      response += "For more personalized advice, consider your specific health goals and dietary needs.";
    }

    // Add user-specific context if available
    if (userContext?.enrolledPlan) {
      response += `\n\n💡 This information can be tailored to your ${userContext.enrolledPlan} plan. Would you like specific recommendations?`;
    } else {
      response += "\n\n💡 Consider signing up for a personalized nutrition plan for more targeted advice!";
    }

    return response;
  }

  async getCollectionStats(): Promise<{
    totalDocuments: number;
    collectionName: string;
  }> {
    try {
      if (this.useFileStore) {
        return await fileStore.getCollectionStats();
      } else if (this.useInMemory) {
        return await this.inMemoryStore.getCollectionStats();
      } else {
        if (!this.collection) {
          throw new Error('Collection not initialized');
        }

        const count = await this.collection.count();

        return {
          totalDocuments: count,
          collectionName: this.collectionName,
        };
      }
    } catch (error) {
      logError('Getting collection stats', error);
      return { totalDocuments: 0, collectionName: this.collectionName };
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      if (this.useInMemory) {
        await this.inMemoryStore.deleteDocument(documentId);
      } else {
        if (!this.collection) {
          throw new Error('Collection not initialized');
        }

        await this.collection.delete({
          ids: [documentId]
        });
      }

      devLog(`Deleted document from Local RAG: ${documentId}`);
    } catch (error) {
      logError('Deleting document from Local RAG', error, { documentId });
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    try {
      if (this.useInMemory) {
        await this.inMemoryStore.clearCollection();
      } else {
        if (!chroma) {
          throw new Error('ChromaDB not initialized');
        }

        await chroma.deleteCollection({ name: this.collectionName });

        // Recreate empty collection
        this.collection = await chroma.createCollection({
          name: this.collectionName,
          metadata: { description: 'Nutrition knowledge base for RAG' }
        });
      }

      devLog('Cleared Local RAG collection');
    } catch (error) {
      logError('Clearing Local RAG collection', error);
      throw error;
    }
  }

  async updateDocument(document: NutritionDocument): Promise<void> {
    // Update is same as add in vector databases (upsert operation)
    await this.addDocument(document);
  }
}

// Export singleton instance
export const localNutritionRAG = new LocalNutritionRAG();