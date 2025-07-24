import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface TrainingMatch {
  intentId: string;
  intentName: string;
  confidence: number;
  matchedKeywords: string[];
  response: string;
  responseType: string;
  variables?: Prisma.JsonValue;
  conditions?: Prisma.JsonValue;
}

interface IntentWithData {
  id: string;
  name: string;
  priority: number;
  examples: {
    id: string;
    userInput: string;
    keywords: string[];
    confidence: number;
  }[];
  responses: {
    id: string;
    response: string;
    responseType: string;
    priority: number;
    conditions?: Prisma.JsonValue;
    variables?: Prisma.JsonValue;
  }[];
}

class TrainingDataMatcher {
  private cachedIntents: IntentWithData[] = [];
  private lastCacheUpdate = 0;
  private cacheExpiry = 300000; // 5 minutes

  private async loadTrainingData(): Promise<IntentWithData[]> {
    const now = Date.now();
    if (this.cachedIntents.length > 0 && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return this.cachedIntents;
    }

    const intents = await prisma.trainingIntent.findMany({
      where: { isActive: true },
      include: {
        examples: {
          where: { isActive: true },
          orderBy: { confidence: 'desc' }
        },
        responses: {
          where: { isActive: true },
          orderBy: { priority: 'desc' }
        }
      },
      orderBy: { priority: 'desc' }
    });

    this.cachedIntents = intents;
    this.lastCacheUpdate = now;
    return intents;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractKeywords(text: string): string[] {
    const normalized = this.normalizeText(text);
    const words = normalized.split(' ').filter(word => word.length > 2);
    
    // Remove common stop words
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their', 'what', 'when', 'where', 'why', 'how'
    ]);
    
    const filteredWords = words.filter(word => !stopWords.has(word));
    
    // Extract n-grams for better context
    const keywords = [...filteredWords];
    for (let i = 0; i < filteredWords.length - 1; i++) {
      keywords.push(`${filteredWords[i]} ${filteredWords[i + 1]}`);
    }
    
    return keywords.slice(0, 20);
  }

  private calculateSimilarity(userKeywords: string[], exampleKeywords: string[]): number {
    if (userKeywords.length === 0 || exampleKeywords.length === 0) {
      return 0;
    }

    // Exact keyword matches
    const exactMatches = userKeywords.filter(keyword => 
      exampleKeywords.includes(keyword)
    ).length;
    
    // Partial keyword matches (for fuzzy matching)
    let partialMatches = 0;
    for (const userKeyword of userKeywords) {
      for (const exampleKeyword of exampleKeywords) {
        if (userKeyword.includes(exampleKeyword) || exampleKeyword.includes(userKeyword)) {
          partialMatches += 0.5;
          break;
        }
      }
    }
    
    const totalMatches = exactMatches + partialMatches;
    const keywordScore = totalMatches / Math.max(userKeywords.length, exampleKeywords.length);
    
    // Boost score for phrase matches
    const userText = userKeywords.join(' ');
    const exampleText = exampleKeywords.join(' ');
    const phraseBoost = this.calculatePhraseMatch(userText, exampleText);
    
    return Math.min(keywordScore + phraseBoost, 1.0);
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculatePhraseMatch(userText: string, exampleText: string): number {
    const userPhrases = userText.split(' ');
    const examplePhrases = exampleText.split(' ');
    
    let longestMatch = 0;
    for (let i = 0; i < userPhrases.length; i++) {
      for (let j = 0; j < examplePhrases.length; j++) {
        let matchLength = 0;
        while (
          i + matchLength < userPhrases.length &&
          j + matchLength < examplePhrases.length &&
          userPhrases[i + matchLength] === examplePhrases[j + matchLength]
        ) {
          matchLength++;
        }
        longestMatch = Math.max(longestMatch, matchLength);
      }
    }
    
    return longestMatch > 1 ? longestMatch * 0.1 : 0;
  }

  private calculateAdvancedSimilarity(userInput: string, exampleInput: string): number {
    const userNormalized = this.normalizeText(userInput);
    const exampleNormalized = this.normalizeText(exampleInput);

    // Exact match
    if (userNormalized === exampleNormalized) {
      return 1.0;
    }

    // Substring match
    if (exampleNormalized.includes(userNormalized) || userNormalized.includes(exampleNormalized)) {
      return 0.9;
    }

    // Keyword-based similarity
    const userKeywords = this.extractKeywords(userInput);
    const exampleKeywords = this.extractKeywords(exampleInput);
    const keywordSimilarity = this.calculateSimilarity(userKeywords, exampleKeywords);

    // Levenshtein distance similarity
    const maxLength = Math.max(userNormalized.length, exampleNormalized.length);
    const distance = this.calculateLevenshteinDistance(userNormalized, exampleNormalized);
    const levenshteinSimilarity = maxLength > 0 ? 1 - (distance / maxLength) : 0;

    // Semantic similarity boost for nutrition/health terms
    const semanticBoost = this.calculateSemanticBoost(userNormalized, exampleNormalized);
    
    // Combined score with weights
    const combinedScore = (keywordSimilarity * 0.6) + (levenshteinSimilarity * 0.3) + (semanticBoost * 0.1);
    
    return Math.min(combinedScore, 1.0);
  }

  private evaluateConditions(conditions: Prisma.JsonValue | null, context: Record<string, unknown> = {}): boolean {
    if (!conditions || conditions === null) {
      return true;
    }

    // Handle conditions as an object
    if (typeof conditions === 'object' && !Array.isArray(conditions)) {
      const conditionsObj = conditions as Record<string, unknown>;
      if (Object.keys(conditionsObj).length === 0) {
        return true;
      }

      // Simple condition evaluation - can be extended
      for (const [key, value] of Object.entries(conditionsObj)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private calculateSemanticBoost(userText: string, exampleText: string): number {
    // Define semantic groups for nutrition domain
    const semanticGroups = {
      weightLoss: ['lose', 'weight', 'fat', 'slim', 'diet', 'calories', 'deficit'],
      weightGain: ['gain', 'weight', 'muscle', 'bulk', 'mass', 'protein'],
      nutrition: ['nutrition', 'nutrients', 'vitamins', 'minerals', 'healthy', 'food'],
      fitness: ['exercise', 'workout', 'fitness', 'training', 'gym', 'cardio'],
      health: ['health', 'wellness', 'medical', 'doctor', 'symptoms'],
      bmi: ['bmi', 'body', 'mass', 'index', 'calculate', 'height', 'weight']
    };
    
    let maxBoost = 0;
    for (const [group, terms] of Object.entries(semanticGroups)) {
      const userMatches = terms.filter(term => userText.includes(term)).length;
      const exampleMatches = terms.filter(term => exampleText.includes(term)).length;
      
      if (userMatches > 0 && exampleMatches > 0) {
        const groupBoost = Math.min(userMatches, exampleMatches) / Math.max(userMatches, exampleMatches);
        maxBoost = Math.max(maxBoost, groupBoost * 0.2);
      }
    }
    
    return maxBoost;
  }

  private processVariables(responseText: string, variables: Prisma.JsonValue | null = null, userInput: string = ''): string {
    let processedResponse = responseText;

    // Replace predefined variables
    if (variables && typeof variables === 'object' && !Array.isArray(variables)) {
      const variablesObj = variables as Record<string, unknown>;
      for (const [key, value] of Object.entries(variablesObj)) {
        const placeholder = `{{${key}}}`;
        processedResponse = processedResponse.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }

    // Replace dynamic variables
    processedResponse = processedResponse.replace(/{{user_name}}/g, 'there');
    processedResponse = processedResponse.replace(/{{user_input}}/g, userInput);
    processedResponse = processedResponse.replace(/{{timestamp}}/g, new Date().toLocaleString());

    return processedResponse;
  }

  async findBestMatch(userInput: string, context: Record<string, unknown> = {}): Promise<TrainingMatch | null> {
    try {
      const intents = await this.loadTrainingData();
      let bestMatch: TrainingMatch | null = null;
      let bestScore = 0;

      const userKeywords = this.extractKeywords(userInput);

      for (const intent of intents) {
        // Skip intents with no examples or responses
        if (intent.examples.length === 0 || intent.responses.length === 0) {
          continue;
        }

        let intentBestScore = 0;
        let bestExample = null;

        // Find best matching example for this intent
        for (const example of intent.examples) {
          const similarity = this.calculateAdvancedSimilarity(userInput, example.userInput);
          const weightedScore = similarity * example.confidence;

          if (weightedScore > intentBestScore) {
            intentBestScore = weightedScore;
            bestExample = example;
          }
        }

        // Apply intent priority boost
        const priorityBoost = intent.priority * 0.05; // 5% boost per priority level
        const finalScore = Math.min(intentBestScore + priorityBoost, 1.0);

        // Adaptive threshold based on intent priority
        const threshold = Math.max(0.3 - (intent.priority * 0.02), 0.15);
        
        // Check if this is the best match so far
        if (finalScore > bestScore && finalScore > threshold) {
          // Find best response for this intent
          const availableResponses = intent.responses.filter(response => 
            this.evaluateConditions(response.conditions || null, context)
          );

          if (availableResponses.length > 0) {
            const selectedResponse = availableResponses[0]; // Highest priority response

            bestMatch = {
              intentId: intent.id,
              intentName: intent.name,
              confidence: finalScore,
              matchedKeywords: bestExample ? bestExample.keywords.filter(k => userKeywords.includes(k)) : [],
              response: this.processVariables(selectedResponse.response, selectedResponse.variables || null, userInput),
              responseType: selectedResponse.responseType,
              variables: selectedResponse.variables,
              conditions: selectedResponse.conditions
            };

            bestScore = finalScore;
          }
        }
      }

      // Log the match for analytics
      if (bestMatch) {
        await this.logMatchAnalytics(userInput, bestMatch, context);
      }

      return bestMatch;
    } catch (error) {
      console.error('Error finding training match:', error);
      return null;
    }
  }

  private async logMatchAnalytics(
    userInput: string, 
    match: TrainingMatch, 
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      await prisma.chatbotAnalytics.create({
        data: {
          sessionId: (context.sessionId as string) || 'unknown',
          intentMatched: match.intentId,
          confidence: match.confidence,
          responseUsed: match.response.substring(0, 255), // Truncate if needed
          userContext: context as Prisma.InputJsonValue || {},
          fallbackUsed: false
        }
      });

      // Update response usage count
      await prisma.trainingResponse.updateMany({
        where: { 
          intentId: match.intentId,
          response: match.response
        },
        data: {
          usageCount: { increment: 1 }
        }
      });
    } catch (error) {
      console.error('Error logging match analytics:', error);
    }
  }

  async refreshCache(): Promise<void> {
    this.cachedIntents = [];
    this.lastCacheUpdate = 0;
    await this.loadTrainingData();
  }

  async getMatchStatistics(): Promise<Array<{
    intentId: string;
    intentName: string;
    matchCount: number;
    avgConfidence: number;
  }>> {
    const stats = await prisma.chatbotAnalytics.groupBy({
      by: ['intentMatched'],
      _count: { id: true },
      _avg: { confidence: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
      where: { intentMatched: { not: null } }
    });

    const intents = await prisma.trainingIntent.findMany({
      where: { 
        id: { in: stats.map(s => s.intentMatched).filter(Boolean) as string[] }
      },
      select: { id: true, name: true }
    });

    return stats.map(stat => ({
      intentId: stat.intentMatched || 'unknown',
      intentName: intents.find(i => i.id === stat.intentMatched)?.name || 'Unknown',
      matchCount: stat._count.id,
      avgConfidence: stat._avg.confidence || 0
    }));
  }
}

// Export singleton instance
export const trainingMatcher = new TrainingDataMatcher();

// Export for testing
export { TrainingDataMatcher, type TrainingMatch };