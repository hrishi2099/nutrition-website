import { prisma } from '@/lib/prisma';

interface TrainingMatch {
  intentId: string;
  intentName: string;
  confidence: number;
  matchedKeywords: string[];
  response: string;
  responseType: string;
  variables?: any;
  conditions?: any;
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
    conditions?: any;
    variables?: any;
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
    return normalized
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 15);
  }

  private calculateSimilarity(userKeywords: string[], exampleKeywords: string[]): number {
    if (userKeywords.length === 0 || exampleKeywords.length === 0) {
      return 0;
    }

    const matchingKeywords = userKeywords.filter(keyword => 
      exampleKeywords.includes(keyword)
    );

    const keywordScore = matchingKeywords.length / Math.max(userKeywords.length, exampleKeywords.length);
    
    // Boost score if there are exact substring matches
    const userText = userKeywords.join(' ');
    const exampleText = exampleKeywords.join(' ');
    const substringBoost = exampleText.includes(userText) || userText.includes(exampleText) ? 0.2 : 0;

    return Math.min(keywordScore + substringBoost, 1.0);
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

    // Combined score with weights
    const combinedScore = (keywordSimilarity * 0.7) + (levenshteinSimilarity * 0.3);
    
    return Math.min(combinedScore, 1.0);
  }

  private evaluateConditions(conditions: any, context: any = {}): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // Simple condition evaluation - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private processVariables(responseText: string, variables: any = {}, userInput: string = ''): string {
    let processedResponse = responseText;

    // Replace predefined variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processedResponse = processedResponse.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Replace dynamic variables
    processedResponse = processedResponse.replace(/{{user_name}}/g, 'there');
    processedResponse = processedResponse.replace(/{{user_input}}/g, userInput);
    processedResponse = processedResponse.replace(/{{timestamp}}/g, new Date().toLocaleString());

    return processedResponse;
  }

  async findBestMatch(userInput: string, context: any = {}): Promise<TrainingMatch | null> {
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

        // Check if this is the best match so far
        if (finalScore > bestScore && finalScore > 0.3) { // Minimum threshold
          // Find best response for this intent
          const availableResponses = intent.responses.filter(response => 
            this.evaluateConditions(response.conditions, context)
          );

          if (availableResponses.length > 0) {
            const selectedResponse = availableResponses[0]; // Highest priority response

            bestMatch = {
              intentId: intent.id,
              intentName: intent.name,
              confidence: finalScore,
              matchedKeywords: bestExample ? bestExample.keywords.filter(k => userKeywords.includes(k)) : [],
              response: this.processVariables(selectedResponse.response, selectedResponse.variables, userInput),
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
    context: any
  ): Promise<void> {
    try {
      await prisma.chatbotAnalytics.create({
        data: {
          userInput,
          matchedIntentId: match.intentId,
          confidence: match.confidence,
          responseType: match.responseType,
          context: context || {},
          matchedKeywords: match.matchedKeywords,
          timestamp: new Date()
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

  async getMatchStatistics(): Promise<any> {
    const stats = await prisma.chatbotAnalytics.groupBy({
      by: ['matchedIntentId'],
      _count: { id: true },
      _avg: { confidence: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const intents = await prisma.trainingIntent.findMany({
      where: { 
        id: { in: stats.map(s => s.matchedIntentId).filter(Boolean) as string[] }
      },
      select: { id: true, name: true }
    });

    return stats.map(stat => ({
      intentId: stat.matchedIntentId,
      intentName: intents.find(i => i.id === stat.matchedIntentId)?.name || 'Unknown',
      matchCount: stat._count.id,
      avgConfidence: stat._avg.confidence || 0
    }));
  }
}

// Export singleton instance
export const trainingMatcher = new TrainingDataMatcher();

// Export for testing
export { TrainingDataMatcher, type TrainingMatch };