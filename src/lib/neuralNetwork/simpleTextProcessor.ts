export interface ProcessedText {
  original: string;
  normalized: string;
  tokens: string[];
  stems: string[];
  entities: string[];
  features: number[];
}

export class SimpleTextProcessor {
  private vocabulary: Map<string, number>;
  private maxVocabSize: number;
  private minWordFreq: number;

  // Common English stop words
  private stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
    'her', 'its', 'our', 'their', 'what', 'when', 'where', 'why', 'how'
  ]);

  constructor(maxVocabSize = 10000, minWordFreq = 2) {
    this.vocabulary = new Map();
    this.maxVocabSize = maxVocabSize;
    this.minWordFreq = minWordFreq;
  }

  /**
   * Normalize text by cleaning and standardizing format
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\d+/g, 'NUMBER') // Replace numbers with token
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Simple tokenization
   */
  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }

  /**
   * Simple stemming (remove common suffixes)
   */
  private stem(word: string): string {
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ion', 'tion', 'ness', 'ment'];
    let stemmed = word;
    
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        stemmed = word.slice(0, -suffix.length);
        break;
      }
    }
    
    return stemmed;
  }

  /**
   * Extract nutrition-related entities
   */
  private extractEntities(text: string): string[] {
    const nutritionKeywords = [
      'protein', 'carbs', 'carbohydrates', 'fat', 'calories', 'vitamins',
      'minerals', 'fiber', 'sugar', 'sodium', 'weight', 'muscle', 'diet',
      'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'recipe', 'food',
      'nutrition', 'healthy', 'exercise', 'fitness', 'bmi', 'loss', 'gain'
    ];

    const normalizedText = text.toLowerCase();
    const entities: string[] = [];

    nutritionKeywords.forEach(keyword => {
      if (normalizedText.includes(keyword)) {
        entities.push(keyword);
      }
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Build vocabulary from training texts
   */
  buildVocabulary(texts: string[]): void {
    const wordFreq = new Map<string, number>();

    // Count word frequencies
    texts.forEach(text => {
      const normalized = this.normalizeText(text);
      const tokens = this.tokenize(normalized);
      const filteredTokens = tokens.filter(token => 
        token.length > 2 && !this.stopWords.has(token)
      );

      filteredTokens.forEach(token => {
        const stem = this.stem(token);
        wordFreq.set(stem, (wordFreq.get(stem) || 0) + 1);
      });
    });

    // Build vocabulary with most frequent words
    const sortedWords = Array.from(wordFreq.entries())
      .filter(([, freq]) => freq >= this.minWordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxVocabSize);

    this.vocabulary.clear();
    sortedWords.forEach(([word], index) => {
      this.vocabulary.set(word, index);
    });

    console.log(`Built vocabulary with ${this.vocabulary.size} words`);
  }

  /**
   * Process text into structured format
   */
  processText(text: string): ProcessedText {
    const normalized = this.normalizeText(text);
    const tokens = this.tokenize(normalized);
    const filteredTokens = tokens.filter(token => 
      token.length > 2 && !this.stopWords.has(token)
    );
    const stems = filteredTokens.map(token => this.stem(token));
    
    const entities = this.extractEntities(text);
    const features = this.textToVector(stems);

    return {
      original: text,
      normalized,
      tokens: filteredTokens,
      stems,
      entities,
      features
    };
  }

  /**
   * Convert text to numerical vector using bag of words
   */
  private textToVector(stems: string[]): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    
    stems.forEach(stem => {
      const index = this.vocabulary.get(stem);
      if (index !== undefined) {
        vector[index] += 1; // Simple bag of words
      }
    });

    // Normalize vector (TF normalization)
    const sum = vector.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      return vector.map(v => v / sum);
    }

    return vector;
  }

  /**
   * Convert multiple texts to feature matrix
   */
  textsToMatrix(texts: string[]): number[][] {
    return texts.map(text => {
      const processed = this.processText(text);
      return processed.features;
    });
  }

  /**
   * Get vocabulary size
   */
  getVocabularySize(): number {
    return this.vocabulary.size;
  }

  /**
   * Get vocabulary as array
   */
  getVocabulary(): string[] {
    return Array.from(this.vocabulary.keys());
  }

  /**
   * Save vocabulary to JSON
   */
  exportVocabulary(): Record<string, number> {
    return Object.fromEntries(this.vocabulary);
  }

  /**
   * Load vocabulary from JSON
   */
  importVocabulary(vocab: Record<string, number>): void {
    this.vocabulary = new Map(Object.entries(vocab));
  }

  /**
   * Calculate text similarity using cosine similarity
   */
  calculateSimilarity(text1: string, text2: string): number {
    const vec1 = this.processText(text1).features;
    const vec2 = this.processText(text2).features;

    return this.cosineSimilarity(vec1, vec2);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }
}

// Singleton instance
export const simpleTextProcessor = new SimpleTextProcessor();