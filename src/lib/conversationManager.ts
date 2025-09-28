import { prisma } from '@/lib/prisma';

interface ConversationContext {
  userId?: string;
  sessionId: string;
  firstName?: string;
  enrolledPlan?: {
    id: string;
    name: string;
    type: string;
  };
  goals?: Array<{
    id: string;
    type: string;
    target?: number;
    deadline?: Date;
  }>;
  previousMessages: Array<{ role: string; content: string; timestamp: Date }>;
}

interface SmartResponse {
  response: string;
  confidence: number;
  type: 'greeting' | 'small_talk' | 'question' | 'follow_up' | 'farewell' | 'unknown';
  suggestedActions?: string[];
}

export class ConversationManager {
  private greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
    /^(what's up|how are you|howdy)/i,
    /^(greetings|salutations)/i
  ];

  private farewellPatterns = [
    /^(bye|goodbye|see you|farewell|take care)/i,
    /^(thanks|thank you|thx).*goodbye/i,
    /^(have a good|nice talking|talk later)/i
  ];

  private questionPatterns = [
    /\?(.*)/,
    /^(what|how|why|when|where|who|which|can|could|would|should|do|does|did|is|are|will)/i,
    /^(tell me|explain|help me|show me)/i
  ];

  private smallTalkPatterns = [
    /^(how are you|what's up|how's it going|what are you doing)/i,
    /^(nice to meet|good to see|glad to chat)/i,
    /^(what's your name|who are you|what do you do)/i,
    /^(are you real|are you human|are you ai|are you bot)/i,
    /^(how old are you|where are you from)/i,
    /^(do you like|what do you think|your opinion)/i,
    /^(tell me about yourself|about you)/i
  ];

  private conversationalFillers = [
    /^(um|uh|hmm|well|ok|okay|yeah|yes|no|sure|alright|cool)/i,
    /^(i see|got it|understood|makes sense)/i,
    /^(interesting|nice|great|awesome|good)/i
  ];

  private timeBasedGreetings = {
    morning: ['Good morning', 'Morning', 'Rise and shine'],
    afternoon: ['Good afternoon', 'Hope you\'re having a great afternoon'],
    evening: ['Good evening', 'Evening'],
    night: ['Good evening', 'Hope you\'re winding down well']
  };

  private casualResponses = [
    "I'm doing great, thank you for asking! I'm here and ready to help with any nutrition questions you have.",
    "I'm wonderful! Always excited to chat about nutrition and help people with their health goals.",
    "I'm fantastic! I love helping people discover better nutrition. How can I assist you today?",
    "I'm doing excellent! Ready to dive into any nutrition topics you're curious about."
  ];

  private botIdentityResponses = [
    "I'm NutrisapBot, your AI nutrition assistant! I'm here 24/7 to help with meal planning, nutrition advice, and healthy eating tips.",
    "I'm an AI nutrition assistant created specifically for NutriSap! Think of me as your personal nutrition guide who never sleeps.",
    "I'm NutrisapBot - an AI designed to help you navigate your nutrition journey! I have extensive knowledge about food, diets, and healthy living.",
    "I'm your friendly AI nutrition companion! I'm programmed with comprehensive nutrition knowledge to help you make better food choices."
  ];

  /**
   * Analyze message intent and generate appropriate response
   */
  async analyzeAndRespond(message: string, context: ConversationContext): Promise<SmartResponse> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Handle greetings
    if (this.matchesPatterns(normalizedMessage, this.greetingPatterns)) {
      return this.generateGreeting(context);
    }

    // Handle farewells
    if (this.matchesPatterns(normalizedMessage, this.farewellPatterns)) {
      return this.generateFarewell(context);
    }

    // Handle small talk
    if (this.matchesPatterns(normalizedMessage, this.smallTalkPatterns)) {
      return this.generateSmallTalk(normalizedMessage);
    }

    // Handle conversational fillers
    if (this.matchesPatterns(normalizedMessage, this.conversationalFillers)) {
      return this.generateFillerResponse(normalizedMessage);
    }

    // Handle questions
    if (this.matchesPatterns(normalizedMessage, this.questionPatterns)) {
      return this.generateQuestionResponse(message);
    }

    // Check for follow-up opportunities
    const followUp = this.generateFollowUp(message, context);
    if (followUp) {
      return followUp;
    }

    // Default - encourage nutrition questions
    return this.generateDefaultResponse(context);
  }

  private matchesPatterns(message: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(message));
  }

  private generateGreeting(context: ConversationContext): SmartResponse {
    const currentHour = new Date().getHours();
    let timeOfDay: keyof typeof this.timeBasedGreetings;
    
    if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour < 17) timeOfDay = 'afternoon';
    else if (currentHour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const timeGreeting = this.getRandomItem(this.timeBasedGreetings[timeOfDay]);
    const userName = context.firstName ? `, ${context.firstName}` : '';
    
    let response = `${timeGreeting}${userName}! I'm NutrisapBot, your nutrition assistant. `;

    if (context.enrolledPlan) {
      response += `I see you're on our ${context.enrolledPlan.name} plan - excellent choice! `;
    }

    // Check if returning user
    const hasHistory = context.previousMessages.length > 0;
    if (hasHistory && context.firstName) {
      response += `Welcome back! Ready to continue your nutrition journey?`;
    } else if (context.firstName) {
      response += `Great to meet you! I'm here to help with all your nutrition questions.`;
    } else {
      response += `I'm here to help with meal planning, nutrition advice, and healthy eating tips!`;
    }

    const suggestions = [
      "Ask about meal planning",
      "Calculate your BMI", 
      "Get nutrition advice",
      "Learn about your diet plan"
    ];

    return {
      response,
      confidence: 0.95,
      type: 'greeting',
      suggestedActions: suggestions
    };
  }

  private generateFarewell(context: ConversationContext): SmartResponse {
    const farewells = [
      "Goodbye! Keep up the great work on your nutrition journey!",
      "Take care! Remember, I'm here whenever you need nutrition guidance.",
      "See you later! Wishing you success with your health goals!",
      "Farewell! Don't forget to stay hydrated and eat those veggies!",
      "Bye for now! Feel free to come back anytime with nutrition questions."
    ];

    let response = this.getRandomItem(farewells);
    
    if (context.enrolledPlan) {
      response += ` And don't forget about your ${context.enrolledPlan.name} plan meals!`;
    }

    if (context.firstName) {
      response = response.replace(/!/, `, ${context.firstName}!`);
    }

    return {
      response,
      confidence: 0.9,
      type: 'farewell'
    };
  }

  private generateSmallTalk(message: string): SmartResponse {
    // How are you responses
    if (/how are you|what's up|how's it going/.test(message)) {
      const response = this.getRandomItem(this.casualResponses);
      return {
        response,
        confidence: 0.85,
        type: 'small_talk',
        suggestedActions: ["What's your nutrition goal?", "Need meal planning help?"]
      };
    }

    // Identity questions
    if (/who are you|what's your name|tell me about yourself/.test(message)) {
      const response = this.getRandomItem(this.botIdentityResponses);
      return {
        response,
        confidence: 0.9,
        type: 'small_talk',
        suggestedActions: ["Learn about meal plans", "Ask nutrition questions"]
      };
    }

    // AI/Bot questions
    if (/are you (real|human|ai|bot|robot)/.test(message)) {
      const responses = [
        "I'm an AI nutrition assistant! While I'm not human, I'm trained with comprehensive nutrition knowledge to give you accurate, helpful advice.",
        "Yes, I'm an AI! But don't worry - I'm specifically designed to help with nutrition and have access to evidence-based nutritional information.",
        "I'm definitely an AI, but I'm a pretty smart one when it comes to nutrition! I'm here to provide you with reliable dietary guidance.",
        "You got me - I'm an AI! But I'm passionate about nutrition (well, as passionate as an AI can be) and love helping people eat healthier."
      ];
      
      return {
        response: this.getRandomItem(responses),
        confidence: 0.88,
        type: 'small_talk',
        suggestedActions: ["Ask about my nutrition knowledge", "Get personalized advice"]
      };
    }

    // Opinion questions
    if (/what do you think|your opinion|do you like/.test(message)) {
      const responses = [
        "As an AI, I don't have personal preferences, but I can share evidence-based nutritional insights! What specific topic would you like my analysis on?",
        "I don't have personal opinions, but I can provide research-backed nutrition information! What would you like to know about?",
        "While I don't have personal tastes, I can give you science-based nutrition guidance! What topic interests you?",
        "I don't experience taste or preference like humans do, but I can share nutritional facts and recommendations! What can I help you with?"
      ];

      return {
        response: this.getRandomItem(responses),
        confidence: 0.8,
        type: 'small_talk',
        suggestedActions: ["Ask about healthy foods", "Get nutrition facts"]
      };
    }

    // Default small talk response
    return {
      response: "That's a great question! While I love chatting, I'm especially good at nutrition topics. Is there anything about food, diet, or healthy eating you'd like to explore?",
      confidence: 0.7,
      type: 'small_talk',
      suggestedActions: ["Ask nutrition questions", "Plan your meals"]
    };
  }

  private generateFillerResponse(message: string): SmartResponse {
    if (/^(ok|okay|alright|cool|nice|great|awesome)/.test(message)) {
      const responses = [
        "Glad to hear it! What nutrition topic would you like to dive into?",
        "Perfect! How can I help with your nutrition goals today?",
        "Excellent! Any specific nutrition questions on your mind?",
        "Great! I'm here and ready to discuss anything nutrition-related."
      ];

      return {
        response: this.getRandomItem(responses),
        confidence: 0.75,
        type: 'follow_up',
        suggestedActions: ["Ask about meal planning", "Get nutrition advice"]
      };
    }

    if (/^(i see|got it|understood|makes sense)/.test(message)) {
      const responses = [
        "Wonderful! Feel free to ask if you need clarification on anything or have other nutrition questions.",
        "Perfect! Is there anything else about nutrition you'd like to explore?",
        "Great! Let me know if you want to dive deeper into any nutrition topics.",
        "Excellent! I'm here if you need more nutrition guidance or have other questions."
      ];

      return {
        response: this.getRandomItem(responses),
        confidence: 0.8,
        type: 'follow_up',
        suggestedActions: ["Ask follow-up questions", "Explore new topics"]
      };
    }

    // Default filler response
    return {
      response: "I'm here and ready to help! What nutrition topic can I assist you with?",
      confidence: 0.6,
      type: 'follow_up'
    };
  }

  private generateQuestionResponse(message: string): SmartResponse {
    // This will be handled by the main chatbot logic for nutrition-specific questions
    // But we can provide some guidance for very general questions
    
    if (/^(what|how) (can|could) (you|i)/.test(message.toLowerCase())) {
      return {
        response: "I can help with a wide range of nutrition topics! I'm particularly good at meal planning, dietary advice, BMI calculations, and explaining nutritional concepts. What specific area interests you?",
        confidence: 0.7,
        type: 'question',
        suggestedActions: ["Meal planning help", "Nutrition education", "Personal recommendations"]
      };
    }

    // Let the main system handle specific nutrition questions
    return {
      response: "",
      confidence: 0.0,
      type: 'unknown'
    };
  }

  private generateFollowUp(message: string, context: ConversationContext): SmartResponse | null {
    const recentMessages = context.previousMessages.slice(-3);
    
    // Check if user seems confused or needs clarification
    if (/^(what|huh|confused|don't understand|unclear)/.test(message.toLowerCase())) {
      return {
        response: "I'd be happy to clarify! Could you let me know what specific part you'd like me to explain differently? I can break down nutrition concepts in simpler terms.",
        confidence: 0.8,
        type: 'follow_up',
        suggestedActions: ["Ask for simpler explanation", "Try a different question"]
      };
    }

    // Check if user wants to continue previous topic
    const lastBotMessage = recentMessages.find(msg => msg.role === 'assistant');
    if (lastBotMessage && /^(more|continue|tell me more|what else)/.test(message.toLowerCase())) {
      return {
        response: "I'd love to share more! Could you be a bit more specific about what aspect you'd like me to expand on? This helps me give you the most relevant information.",
        confidence: 0.75,
        type: 'follow_up',
        suggestedActions: ["Be more specific", "Ask detailed questions"]
      };
    }

    return null;
  }

  private generateDefaultResponse(context: ConversationContext): SmartResponse {
    const responses = [
      "I'm not quite sure how to respond to that, but I'm great with nutrition questions! Try asking about meal planning, healthy eating, or dietary advice.",
      "That's interesting, but nutrition is my specialty! What food or diet-related questions can I help you with?",
      "I'd love to help you with that, but I'm best at nutrition topics. How about we chat about healthy eating or meal planning?",
      "I'm not sure about that topic, but I'm excellent with nutrition advice! What would you like to know about food, diet, or healthy living?"
    ];

    const userName = context.firstName ? ` ${context.firstName}` : '';
    let response = this.getRandomItem(responses);
    
    if (userName) {
      response = response.replace(/!/, `${userName}!`);
    }

    const suggestions = context.enrolledPlan 
      ? ["Ask about your meal plan", "Get nutrition advice", "BMI calculator"]
      : ["Learn about meal plans", "Get nutrition advice", "BMI calculator", "Sign up for personalized plans"];

    return {
      response,
      confidence: 0.5,
      type: 'unknown',
      suggestedActions: suggestions
    };
  }

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Log conversation for improvement
   */
  async logConversation(
    message: string, 
    response: SmartResponse, 
    context: ConversationContext
  ): Promise<void> {
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId: context.sessionId,
          role: 'assistant',
          content: `[${response.type}:${response.confidence}] ${response.response}`,
          userContext: {
            conversationType: response.type,
            confidence: response.confidence,
            userId: context.userId,
            hasEnrolledPlan: !!context.enrolledPlan
          }
        }
      });
    } catch (error) {
      console.error('Error logging conversation:', error);
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(sessionId: string): Promise<{
    totalMessages: number;
    conversationTypes: Record<string, number>;
    averageConfidence: number;
  }> {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { 
          sessionId,
          role: 'assistant',
          content: { contains: '[' } // Only conversation manager responses
        },
        take: 50
      });

      const conversationTypes: Record<string, number> = {};
      let totalConfidence = 0;
      let confidenceCount = 0;

      messages.forEach(msg => {
        const typeMatch = msg.content.match(/\[(\w+):(\d+\.?\d*)\]/);
        if (typeMatch) {
          const [, type, confidence] = typeMatch;
          conversationTypes[type] = (conversationTypes[type] || 0) + 1;
          totalConfidence += parseFloat(confidence);
          confidenceCount++;
        }
      });

      return {
        totalMessages: messages.length,
        conversationTypes,
        averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return { totalMessages: 0, conversationTypes: {}, averageConfidence: 0 };
    }
  }
}

// Singleton instance
export const conversationManager = new ConversationManager();