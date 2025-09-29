// In-Memory Vector Store for RAG (Fallback when ChromaDB is not available)
import { devLog, logError } from '@/lib/logger';
import type { NutritionDocument, RAGSearchResult } from './localRAG';

interface StoredDocument {
  id: string;
  content: string;
  metadata: NutritionDocument['metadata'];
  embedding: number[];
}

// Global singleton store to persist data across requests
let globalDocuments: Map<string, StoredDocument> | null = null;

export class InMemoryVectorStore {
  private documents: Map<string, StoredDocument>;
  private isInitialized = false;

  constructor() {
    // Use global singleton store to persist across requests
    if (!globalDocuments) {
      globalDocuments = new Map();
    }
    this.documents = globalDocuments;
  }

  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      devLog(`In-memory vector store initialized with ${this.documents.size} existing documents`);
    } catch (error) {
      logError('In-memory vector store initialization', error);
      throw error;
    }
  }

  async addDocument(document: NutritionDocument, embedding: number[]): Promise<void> {
    try {
      this.documents.set(document.id, {
        id: document.id,
        content: document.content,
        metadata: document.metadata,
        embedding
      });

      devLog(`Added document to in-memory store: ${document.id}`);
    } catch (error) {
      logError('Adding document to in-memory store', error, { documentId: document.id });
      throw error;
    }
  }

  async addDocumentsBatch(documents: NutritionDocument[], embeddings: number[][]): Promise<void> {
    try {
      for (let i = 0; i < documents.length; i++) {
        await this.addDocument(documents[i], embeddings[i]);
      }
      devLog(`Added batch of ${documents.length} documents to in-memory store`);
    } catch (error) {
      logError('Adding document batch to in-memory store', error);
      throw error;
    }
  }

  async searchSimilar(
    queryEmbedding: number[],
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
        minSimilarity = 0.3 // Lower threshold for local embeddings
      } = options;

      // Calculate similarities
      const similarities: Array<{ doc: StoredDocument; similarity: number }> = [];

      for (const doc of this.documents.values()) {
        // Apply filters
        if (Object.keys(filter).length > 0) {
          let shouldInclude = true;

          for (const [key, value] of Object.entries(filter)) {
            const metadataValue = (doc.metadata as any)[key];

            if (Array.isArray(value) && value.includes('$in')) {
              // Handle $in operator
              const targetValues = value[1] as unknown[];
              if (!Array.isArray(metadataValue) || !targetValues.some(v => metadataValue.includes(v))) {
                shouldInclude = false;
                break;
              }
            } else if (metadataValue !== value) {
              shouldInclude = false;
              break;
            }
          }

          if (!shouldInclude) continue;
        }

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

        if (similarity >= minSimilarity) {
          similarities.push({ doc, similarity });
        }
      }

      // Sort by similarity and take top K
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topResults = similarities.slice(0, topK);

      // Convert to RAGSearchResult format
      const documents: NutritionDocument[] = topResults.map(result => ({
        id: result.doc.id,
        content: result.doc.content,
        metadata: result.doc.metadata
      }));

      const similarityScores = topResults.map(result => result.similarity);

      const searchTime = Date.now() - startTime;

      devLog(`In-memory search completed: ${documents.length} results in ${searchTime}ms`);

      return {
        documents,
        similarity_scores: similarityScores,
        search_time_ms: searchTime,
        total_results: documents.length
      };
    } catch (error) {
      logError('In-memory vector search', error);
      throw error;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      this.documents.delete(documentId);
      devLog(`Deleted document from in-memory store: ${documentId}`);
    } catch (error) {
      logError('Deleting document from in-memory store', error, { documentId });
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    try {
      this.documents.clear();
      devLog('Cleared in-memory store');
    } catch (error) {
      logError('Clearing in-memory store', error);
      throw error;
    }
  }

  async updateDocument(document: NutritionDocument, embedding: number[]): Promise<void> {
    // Update is same as add in our simple in-memory store
    await this.addDocument(document, embedding);
  }

  async getCollectionStats(): Promise<{
    totalDocuments: number;
    collectionName: string;
  }> {
    return {
      totalDocuments: this.documents.size,
      collectionName: 'in-memory-nutrition-knowledge'
    };
  }
}