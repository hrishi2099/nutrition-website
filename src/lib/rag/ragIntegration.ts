// RAG Integration with Existing Chatbot Workflow
import { localNutritionRAG } from './localRAG';
import { devLog, logError } from '@/lib/logger';

interface UserContext {
  id: string;
  firstName: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
  enrolledPlan?: {
    id: string;
    name: string;
    type: string;
    calories: number;
    mealsPerDay: number;
    duration: number;
  };
  goals?: {
    id: string;
    type: string;
    target: number | null;
    isActive: boolean;
  }[];
}

export class RAGEnhancedChatbot {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await localNutritionRAG.initialize();
        this.isInitialized = true;
        devLog('RAG Enhanced Chatbot initialized');
      }
    } catch (error) {
      logError('RAG Enhanced Chatbot initialization', error);
      throw error;
    }
  }

  async generateRAGResponse(
    message: string,
    userContext: UserContext | null,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<{
    response: string;
    ragUsed: boolean;
    searchTime: number;
    documentsFound: number;
    confidence: number;
  }> {
    const startTime = Date.now();

    try {
      // Ensure RAG is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Prepare user context for RAG search
      const ragUserContext = this.prepareUserContextForRAG(userContext);

      // Get relevant context from RAG
      const relevantContext = await localNutritionRAG.getRelevantContext(
        message,
        ragUserContext,
        1500 // Max tokens for context
      );

      if (!relevantContext || relevantContext.trim().length === 0) {
        // No relevant context found, fall back to existing chatbot logic
        return {
          response: await this.generateFallbackResponse(message, userContext, conversationHistory),
          ragUsed: false,
          searchTime: Date.now() - startTime,
          documentsFound: 0,
          confidence: 0.3
        };
      }

      // Generate enhanced response using RAG context
      const response = await this.generateEnhancedResponse(
        message,
        relevantContext,
        userContext,
        conversationHistory
      );

      // Calculate confidence based on context relevance
      const confidence = this.calculateResponseConfidence(message, relevantContext, response);

      return {
        response,
        ragUsed: true,
        searchTime: Date.now() - startTime,
        documentsFound: this.countDocumentsInContext(relevantContext),
        confidence
      };

    } catch (error) {
      logError('RAG response generation', error);

      // Fallback to existing system
      return {
        response: await this.generateFallbackResponse(message, userContext, conversationHistory),
        ragUsed: false,
        searchTime: Date.now() - startTime,
        documentsFound: 0,
        confidence: 0.2
      };
    }
  }

  private prepareUserContextForRAG(userContext: UserContext | null): {
    goals?: string[];
    dietaryRestrictions?: string[];
    activityLevel?: string;
    enrolledPlan?: string;
  } {
    if (!userContext) {
      return {};
    }

    return {
      goals: userContext.goals?.map(goal => goal.type) || [],
      activityLevel: userContext.activityLevel || undefined,
      enrolledPlan: userContext.enrolledPlan?.type || undefined,
      dietaryRestrictions: [] // Could be expanded from user preferences
    };
  }

  private async generateEnhancedResponse(
    query: string,
    context: string,
    userContext: UserContext | null,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    const userName = userContext?.firstName || '';
    const greeting = userName ? `Hi ${userName}! ` : '';

    // Analyze query intent
    const intent = this.analyzeQueryIntent(query);

    // Build response based on intent and context
    let response = greeting;

    switch (intent.type) {
      case 'nutrition_info':
        response += await this.generateNutritionInfoResponse(query, context, userContext);
        break;

      case 'calorie_calculation':
        response += await this.generateCalorieResponse(query, context, userContext);
        break;

      case 'meal_planning':
        response += await this.generateMealPlanningResponse(query, context, userContext);
        break;

      case 'supplement_advice':
        response += await this.generateSupplementResponse(query, context, userContext);
        break;

      case 'recipe_request':
        response += await this.generateRecipeResponse(query, context, userContext);
        break;

      case 'weight_management':
        response += await this.generateWeightManagementResponse(query, context, userContext);
        break;

      case 'health_condition':
        response += await this.generateHealthConditionResponse(query, context, userContext);
        break;

      default:
        response += await this.generateGeneralNutritionResponse(query, context, userContext);
    }

    // Add conversation context awareness
    response = this.addConversationContext(response, conversationHistory, userContext);

    // Add personalized recommendations
    response = this.addPersonalizedRecommendations(response, userContext, intent.type);

    return response;
  }

  private analyzeQueryIntent(query: string): {
    type: string;
    confidence: number;
    keywords: string[];
  } {
    const queryLower = query.toLowerCase();
    const keywords: string[] = [];

    // Nutrition information intent
    if (queryLower.includes('nutrition') || queryLower.includes('nutrient') ||
        queryLower.includes('vitamin') || queryLower.includes('mineral')) {
      keywords.push('nutrition', 'vitamins', 'minerals');
      return { type: 'nutrition_info', confidence: 0.8, keywords };
    }

    // Calorie calculation intent
    if (queryLower.includes('calorie') || queryLower.includes('energy') ||
        queryLower.includes('bmi') || queryLower.includes('tdee')) {
      keywords.push('calories', 'energy', 'metabolism');
      return { type: 'calorie_calculation', confidence: 0.9, keywords };
    }

    // Meal planning intent
    if (queryLower.includes('meal') || queryLower.includes('plan') ||
        queryLower.includes('diet') || queryLower.includes('menu')) {
      keywords.push('meal', 'planning', 'diet');
      return { type: 'meal_planning', confidence: 0.8, keywords };
    }

    // Supplement advice intent
    if (queryLower.includes('supplement') || queryLower.includes('pill') ||
        queryLower.includes('dosage') || queryLower.includes('recommended')) {
      keywords.push('supplements', 'dosage', 'safety');
      return { type: 'supplement_advice', confidence: 0.8, keywords };
    }

    // Recipe request intent
    if (queryLower.includes('recipe') || queryLower.includes('cook') ||
        queryLower.includes('prepare') || queryLower.includes('ingredient')) {
      keywords.push('recipe', 'cooking', 'ingredients');
      return { type: 'recipe_request', confidence: 0.9, keywords };
    }

    // Weight management intent
    if (queryLower.includes('weight') || queryLower.includes('lose') ||
        queryLower.includes('gain') || queryLower.includes('muscle')) {
      keywords.push('weight', 'fitness', 'body composition');
      return { type: 'weight_management', confidence: 0.8, keywords };
    }

    // Health condition intent
    if (queryLower.includes('diabetes') || queryLower.includes('pressure') ||
        queryLower.includes('cholesterol') || queryLower.includes('condition')) {
      keywords.push('health', 'medical', 'condition');
      return { type: 'health_condition', confidence: 0.7, keywords };
    }

    return { type: 'general', confidence: 0.5, keywords: [] };
  }

  private async generateNutritionInfoResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Based on our comprehensive nutrition database:\n\n";

    // Extract specific nutrition facts from context
    const nutritionFacts = this.extractNutritionFacts(context);

    if (nutritionFacts.length > 0) {
      response += "**Key Nutrition Information:**\n";
      response += nutritionFacts.slice(0, 4).map(fact => `• ${fact}`).join('\n') + '\n\n';
    }

    // Add evidence-based recommendations
    response += "**Evidence-Based Recommendations:**\n";
    response += "• Focus on whole, minimally processed foods\n";
    response += "• Aim for variety in your diet to ensure nutrient adequacy\n";
    response += "• Consider your individual needs based on age, activity, and health status\n\n";

    // Add user-specific context
    if (userContext?.enrolledPlan) {
      response += `💡 These nutrition guidelines align well with your ${userContext.enrolledPlan.name} plan.`;
    }

    return response;
  }

  private async generateCalorieResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Here's personalized calorie and energy information:\n\n";

    // Calculate user-specific metrics if possible
    if (userContext?.weight && userContext?.height && userContext?.age) {
      const bmi = userContext.weight / Math.pow(userContext.height / 100, 2);
      const bmr = this.calculateBMR(userContext);
      const tdee = this.calculateTDEE(bmr, userContext.activityLevel || 'moderate');

      response += `**Your Calculated Metrics:**\n`;
      response += `• BMI: ${bmi.toFixed(1)}\n`;
      response += `• BMR (Basal Metabolic Rate): ${Math.round(bmr)} calories/day\n`;
      response += `• TDEE (Total Daily Energy): ${Math.round(tdee)} calories/day\n\n`;
    }

    // Extract calorie information from context
    const calorieInfo = this.extractCalorieInfo(context);
    if (calorieInfo.length > 0) {
      response += "**Relevant Calorie Information:**\n";
      response += calorieInfo.slice(0, 3).map(info => `• ${info}`).join('\n') + '\n\n';
    }

    response += "**Remember:**\n";
    response += "• These are estimates - individual needs vary\n";
    response += "• Quality of calories matters as much as quantity\n";
    response += "• Consider consulting a nutrition professional for personalized advice";

    return response;
  }

  private async generateMealPlanningResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Here's meal planning guidance based on our nutrition database:\n\n";

    // Extract meal suggestions from context
    const mealSuggestions = this.extractMealSuggestions(context);

    if (mealSuggestions.length > 0) {
      response += "**Recommended Meals:**\n";
      response += mealSuggestions.slice(0, 3).map(meal => `• ${meal}`).join('\n') + '\n\n';
    }

    response += "**Meal Planning Principles:**\n";
    response += "• Include protein, healthy fats, and complex carbs in each meal\n";
    response += "• Aim for 5-9 servings of fruits and vegetables daily\n";
    response += "• Plan meals around your schedule and preferences\n";
    response += "• Prep ingredients in advance for easier execution\n\n";

    // Add user-specific meal planning advice
    if (userContext?.enrolledPlan) {
      response += `🍽️ Your ${userContext.enrolledPlan.name} includes ${userContext.enrolledPlan.mealsPerDay} meals per day targeting ${userContext.enrolledPlan.calories} calories.`;
    } else {
      response += "💡 Consider enrolling in one of our personalized meal plans for structured guidance!";
    }

    return response;
  }

  private async generateSupplementResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Here's evidence-based supplement information:\n\n";

    // Extract supplement information from context
    const supplementInfo = this.extractSupplementInfo(context);

    if (supplementInfo.length > 0) {
      response += "**Supplement Guidance:**\n";
      response += supplementInfo.slice(0, 3).map(info => `• ${info}`).join('\n') + '\n\n';
    }

    response += "**General Supplement Principles:**\n";
    response += "• Food first - supplements should complement, not replace, a healthy diet\n";
    response += "• Quality matters - choose third-party tested products\n";
    response += "• Timing and dosage are important for effectiveness\n";
    response += "• Some nutrients are better absorbed with food\n\n";

    response += "⚠️ **Important Safety Note:**\n";
    response += "Always consult with a healthcare provider before starting new supplements, especially if you have medical conditions or take medications.";

    return response;
  }

  private async generateRecipeResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Here are nutritious recipe suggestions:\n\n";

    // Extract recipe information from context
    const recipes = this.extractRecipeInfo(context);

    if (recipes.length > 0) {
      response += "**Recommended Recipes:**\n";
      recipes.slice(0, 2).forEach((recipe, index) => {
        response += `${index + 1}. ${recipe}\n`;
      });
      response += '\n';
    }

    response += "**Healthy Cooking Tips:**\n";
    response += "• Use cooking methods that preserve nutrients (steaming, grilling, roasting)\n";
    response += "• Include a variety of colorful vegetables\n";
    response += "• Use herbs and spices instead of excess salt\n";
    response += "• Choose whole grain options when possible\n\n";

    response += "Would you like specific cooking instructions or nutritional breakdowns for any of these recipes?";

    return response;
  }

  private async generateWeightManagementResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Here's evidence-based weight management guidance:\n\n";

    // Extract weight management information from context
    const weightInfo = this.extractWeightManagementInfo(context);

    if (weightInfo.length > 0) {
      response += "**Weight Management Strategies:**\n";
      response += weightInfo.slice(0, 4).map(info => `• ${info}`).join('\n') + '\n\n';
    }

    // Add specific advice based on user goals
    if (userContext?.goals) {
      const weightGoals = userContext.goals.filter(goal =>
        goal.type.includes('weight') || goal.type.includes('muscle')
      );

      if (weightGoals.length > 0) {
        response += "**For Your Specific Goals:**\n";
        weightGoals.forEach(goal => {
          response += `• ${goal.type}: ${this.getGoalSpecificAdvice(goal.type)}\n`;
        });
        response += '\n';
      }
    }

    response += "**Remember:**\n";
    response += "• Sustainable changes are more effective than quick fixes\n";
    response += "• Focus on overall health, not just the number on the scale\n";
    response += "• Combine nutrition changes with regular physical activity";

    return response;
  }

  private async generateHealthConditionResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Here's nutrition information for health conditions:\n\n";

    // Extract health condition information from context
    const healthInfo = this.extractHealthConditionInfo(context);

    if (healthInfo.length > 0) {
      response += "**Nutrition Considerations:**\n";
      response += healthInfo.slice(0, 3).map(info => `• ${info}`).join('\n') + '\n\n';
    }

    response += "**General Principles:**\n";
    response += "• Work with healthcare professionals for personalized guidance\n";
    response += "• Focus on anti-inflammatory foods\n";
    response += "• Monitor how different foods affect you individually\n";
    response += "• Maintain consistent eating patterns\n\n";

    response += "🏥 **Important Medical Disclaimer:**\n";
    response += "This information is for educational purposes only. Always consult with your healthcare provider or a registered dietitian for medical nutrition therapy specific to your condition.";

    return response;
  }

  private async generateGeneralNutritionResponse(
    query: string,
    context: string,
    userContext: UserContext | null
  ): Promise<string> {
    let response = "Based on our nutrition knowledge base:\n\n";

    // Extract general information from context
    const generalInfo = this.extractGeneralInfo(context);

    if (generalInfo.length > 0) {
      response += generalInfo.slice(0, 4).map(info => `• ${info}`).join('\n') + '\n\n';
    }

    response += "**Foundational Nutrition Principles:**\n";
    response += "• Eat a variety of whole foods\n";
    response += "• Stay adequately hydrated\n";
    response += "• Listen to your body's hunger and fullness cues\n";
    response += "• Enjoy your food and maintain a positive relationship with eating\n\n";

    response += "Is there a specific aspect of nutrition you'd like to explore further?";

    return response;
  }

  // Helper methods for information extraction
  private extractNutritionFacts(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('vitamin') ||
      line.toLowerCase().includes('mineral') ||
      line.toLowerCase().includes('nutrient') ||
      line.toLowerCase().includes('antioxidant')
    );
  }

  private extractCalorieInfo(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('calorie') ||
      line.toLowerCase().includes('energy') ||
      line.toLowerCase().includes('metabolism')
    );
  }

  private extractMealSuggestions(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('meal') ||
      line.toLowerCase().includes('breakfast') ||
      line.toLowerCase().includes('lunch') ||
      line.toLowerCase().includes('dinner')
    );
  }

  private extractSupplementInfo(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('supplement') ||
      line.toLowerCase().includes('dosage') ||
      line.toLowerCase().includes('recommended')
    );
  }

  private extractRecipeInfo(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('recipe') ||
      line.toLowerCase().includes('ingredient') ||
      line.toLowerCase().includes('cook')
    );
  }

  private extractWeightManagementInfo(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('weight') ||
      line.toLowerCase().includes('loss') ||
      line.toLowerCase().includes('gain') ||
      line.toLowerCase().includes('muscle')
    );
  }

  private extractHealthConditionInfo(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 0);
    return lines.filter(line =>
      line.toLowerCase().includes('diabetes') ||
      line.toLowerCase().includes('pressure') ||
      line.toLowerCase().includes('cholesterol') ||
      line.toLowerCase().includes('condition')
    );
  }

  private extractGeneralInfo(context: string): string[] {
    const lines = context.split('\n').filter(line => line.trim().length > 20);
    return lines.slice(0, 4); // Take first few substantial lines
  }

  // Calculation helper methods
  private calculateBMR(userContext: UserContext): number {
    if (!userContext.weight || !userContext.height || !userContext.age) {
      return 1800; // Default estimate
    }

    // Mifflin-St Jeor Equation
    const bmr = userContext.gender === 'MALE'
      ? 88.362 + (13.397 * userContext.weight) + (4.799 * userContext.height) - (5.677 * userContext.age)
      : 447.593 + (9.247 * userContext.weight) + (3.098 * userContext.height) - (4.330 * userContext.age);

    return bmr;
  }

  private calculateTDEE(bmr: number, activityLevel: string): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const multiplier = multipliers[activityLevel as keyof typeof multipliers] || 1.55;
    return bmr * multiplier;
  }

  private getGoalSpecificAdvice(goalType: string): string {
    const advice = {
      weight_loss: "Create a moderate calorie deficit (300-500 calories) through diet and exercise",
      muscle_gain: "Ensure adequate protein intake (0.8-1g per lb body weight) and resistance training",
      maintenance: "Focus on balanced nutrition and consistent eating patterns",
      general_health: "Emphasize whole foods, variety, and mindful eating practices"
    };

    return advice[goalType as keyof typeof advice] || "Focus on balanced, sustainable nutrition habits";
  }

  private addConversationContext(
    response: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[],
    userContext: UserContext | null
  ): string {
    // Check for follow-up questions or previous topics
    const recentMessages = conversationHistory.slice(-4);
    const hasDiscussedWeightLoss = recentMessages.some(msg =>
      msg.content.toLowerCase().includes('weight loss') || msg.content.toLowerCase().includes('lose weight')
    );

    if (hasDiscussedWeightLoss && !response.toLowerCase().includes('weight')) {
      response += "\n\n💭 Following up on our weight loss discussion - would you like specific meal timing strategies?";
    }

    return response;
  }

  private addPersonalizedRecommendations(
    response: string,
    userContext: UserContext | null,
    intentType: string
  ): string {
    if (!userContext) {
      response += "\n\n💡 Sign up for personalized nutrition plans to get advice tailored to your specific needs!";
      return response;
    }

    if (userContext.enrolledPlan) {
      response += `\n\n📋 This guidance aligns with your ${userContext.enrolledPlan.name} plan. Would you like specific meal suggestions?`;
    } else {
      const planRecommendation = this.recommendPlan(userContext, intentType);
      if (planRecommendation) {
        response += `\n\n💡 ${planRecommendation}`;
      }
    }

    return response;
  }

  private recommendPlan(userContext: UserContext, intentType: string): string {
    if (intentType === 'weight_management') {
      return "Consider our Weight Loss Plan for structured meal planning and calorie guidance!";
    } else if (intentType === 'meal_planning') {
      return "Our personalized meal plans can take the guesswork out of nutrition planning!";
    } else if (intentType === 'calorie_calculation') {
      return "A personalized nutrition plan can provide exact calorie and macro targets for your goals!";
    }

    return "Consider enrolling in one of our nutrition plans for personalized guidance!";
  }

  private calculateResponseConfidence(
    query: string,
    context: string,
    response: string
  ): number {
    // Simple confidence calculation based on context relevance and response quality
    let confidence = 0.5; // Base confidence

    // Increase confidence if context is substantial
    if (context.length > 500) confidence += 0.2;
    if (context.length > 1000) confidence += 0.1;

    // Increase confidence if response includes specific information
    if (response.includes('calories') || response.includes('protein') || response.includes('nutrition')) {
      confidence += 0.1;
    }

    // Increase confidence for specific query types
    if (query.toLowerCase().includes('calorie') && response.includes('calorie')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private countDocumentsInContext(context: string): number {
    // Estimate number of documents based on context structure
    const titleMarkers = context.match(/\([a-z_]+\):/g);
    return titleMarkers?.length || 1;
  }

  private async generateFallbackResponse(
    message: string,
    userContext: UserContext | null,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    // Simple fallback response when RAG fails
    const userName = userContext?.firstName || '';
    const greeting = userName ? `Hi ${userName}! ` : '';

    return `${greeting}I understand you're asking about nutrition. While I don't have specific information readily available right now, I can help with general nutrition guidance. Could you rephrase your question or ask about a specific aspect of nutrition like calories, meal planning, or supplements?`;
  }
}

// Export singleton instance
export const ragEnhancedChatbot = new RAGEnhancedChatbot();