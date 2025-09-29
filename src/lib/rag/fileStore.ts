// File-based persistence for RAG knowledge (development mode)
import fs from 'fs';
import path from 'path';
import { devLog, logError } from '@/lib/logger';
import type { NutritionDocument } from './localRAG';

interface StoredDocument {
  id: string;
  content: string;
  metadata: NutritionDocument['metadata'];
  embedding: number[];
}

const STORE_FILE = path.join(process.cwd(), '.rag-store.json');

export class FileBasedStore {
  private documents: Map<string, StoredDocument> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Load existing documents from file
      if (fs.existsSync(STORE_FILE)) {
        const data = fs.readFileSync(STORE_FILE, 'utf8');
        const stored = JSON.parse(data);

        for (const doc of stored) {
          this.documents.set(doc.id, doc);
        }

        devLog(`File-based store initialized with ${this.documents.size} existing documents`);
      } else {
        devLog('File-based store initialized (no existing data)');
      }

      this.isInitialized = true;
    } catch (error) {
      logError('File-based store initialization', error);
      this.isInitialized = true; // Continue without persistence
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

      // Persist to file
      await this.persistToFile();

      devLog(`Added document to file store: ${document.id}`);
    } catch (error) {
      logError('Adding document to file store', error, { documentId: document.id });
      throw error;
    }
  }

  async addDocumentsBatch(documents: NutritionDocument[], embeddings: number[][]): Promise<void> {
    try {
      for (let i = 0; i < documents.length; i++) {
        this.documents.set(documents[i].id, {
          id: documents[i].id,
          content: documents[i].content,
          metadata: documents[i].metadata,
          embedding: embeddings[i]
        });
      }

      // Persist to file
      await this.persistToFile();

      devLog(`Added batch of ${documents.length} documents to file store`);
    } catch (error) {
      logError('Adding document batch to file store', error);
      throw error;
    }
  }

  async search(queryEmbedding: number[], maxResults: number = 5, minSimilarity: number = 0.5): Promise<{
    documents: NutritionDocument[];
    similarity_scores: number[];
    search_time_ms: number;
    total_results: number;
  }> {
    const startTime = Date.now();

    if (this.documents.size === 0) {
      return {
        documents: [],
        similarity_scores: [],
        search_time_ms: Date.now() - startTime,
        total_results: 0
      };
    }

    // Calculate similarity scores
    const results: { doc: StoredDocument; score: number }[] = [];

    for (const stored of this.documents.values()) {
      const similarity = this.cosineSimilarity(queryEmbedding, stored.embedding);

      if (similarity >= minSimilarity) {
        results.push({ doc: stored, score: similarity });
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.score - a.score);

    // Take top results
    const topResults = results.slice(0, maxResults);

    const documents: NutritionDocument[] = topResults.map(r => ({
      id: r.doc.id,
      content: r.doc.content,
      metadata: r.doc.metadata
    }));

    const similarity_scores = topResults.map(r => r.score);

    return {
      documents,
      similarity_scores,
      search_time_ms: Date.now() - startTime,
      total_results: results.length
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async persistToFile(): Promise<void> {
    try {
      const data = Array.from(this.documents.values());
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      logError('Persisting to file', error);
    }
  }

  async getCollectionStats(): Promise<{
    totalDocuments: number;
    collectionName: string;
    isReady: boolean;
  }> {
    return {
      totalDocuments: this.documents.size,
      collectionName: 'file-based-nutrition-knowledge',
      isReady: this.isInitialized && this.documents.size > 0
    };
  }

  async clearCollection(): Promise<void> {
    this.documents.clear();

    try {
      if (fs.existsSync(STORE_FILE)) {
        fs.unlinkSync(STORE_FILE);
      }
    } catch (error) {
      logError('Clearing file store', error);
    }

    devLog('File-based store cleared');
  }
}

// Export singleton instance
export const fileStore = new FileBasedStore();