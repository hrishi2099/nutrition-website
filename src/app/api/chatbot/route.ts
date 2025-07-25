import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { trainingMatcher } from '@/lib/chatbotTraining';
import { validateChatMessage } from '@/lib/validation';
import { devLog, logError } from '@/lib/logger';
import { neuralNetworkManager } from '@/lib/neuralNetwork/neuralNetworkManager';
import { conversationManager } from '@/lib/conversationManager';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    meals?: {
      id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
  };
  goals?: {
    id: string;
    type: string;
    target: number | null;
    isActive: boolean;
  }[];
}

// Initialize OpenAI - will fallback to rule-based if no API key
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch {
  devLog('OpenAI not configured, using rule-based responses');
}

export async function POST(request: NextRequest) {
  let message: string | undefined;
  let sessionId: string | undefined;
  
  try {
    ({ message, sessionId } = await request.json());

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate chat message
    const messageValidation = validateChatMessage(message);
    if (!messageValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid message',
          details: messageValidation.errors
        },
        { status: 400 }
      );
    }

    // Get user context from authentication
    const userContext = await getUserContext();
    
    // Get or create chat session with memory
    const session = await getOrCreateChatSession(sessionId, userContext?.id);
    
    // Get conversation history from database
    const conversationHistory = await getChatHistory(session.id);
    
    // Generate AI-powered response with user context and memory
    const response = await generateIntelligentResponse(message, conversationHistory, userContext, session.id);
    
    // Store user message and bot response in database
    await storeChatMessages(session.id, message, response, userContext);
    
    // Learn from user interaction (run in background)
    learnFromInteraction(message, response, session.id, userContext?.id).catch(err => 
      logError('chatbot learning', err)
    );

    return NextResponse.json({
      success: true,
      response,
      sessionId: session.sessionId,
      botName: 'NutrisapBot',
      userContext: userContext ? {
        isAuthenticated: true,
        firstName: userContext.firstName,
        hasEnrolledPlan: !!userContext.enrolledPlan
      } : { isAuthenticated: false }
    });

  } catch (error) {
    logError('chatbot API', error, { message: message?.substring(0, 100), sessionId });
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function getUserContext(): Promise<UserContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await verifyJWT(token);
    const userId = payload.userId as string;

    // Fetch user data with enrolled plan and goals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dietPlans: {
          where: { isActive: true },
          include: {
            meals: {
              include: {
                ingredients: true
              }
            }
          }
        },
        goals: {
          where: { isActive: true }
        }
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      firstName: user.firstName,
      age: user.age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      activityLevel: user.activityLevel,
      enrolledPlan: user.dietPlans[0] || null,
      goals: user.goals
    };
  } catch (error) {
    logError('user context retrieval', error);
    return null;
  }
}

async function generateIntelligentResponse(
  message: string, 
  history: ChatMessage[], 
  userContext: UserContext | null,
  sessionId: string
): Promise<string> {
  // First, try conversation manager for natural interactions
  try {
    const conversationContext = {
      userId: userContext?.id,
      sessionId,
      firstName: userContext?.firstName,
      enrolledPlan: userContext?.enrolledPlan,
      goals: userContext?.goals,
      previousMessages: history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date() // Approximate timestamp
      }))
    };

    const conversationResponse = await conversationManager.analyzeAndRespond(message, conversationContext);
    
    // Use conversation manager response if it has good confidence
    if (conversationResponse.confidence > 0.7) {
      devLog(`Conversation manager response: ${conversationResponse.type} (confidence: ${conversationResponse.confidence})`);
      
      // Log the conversation for analytics
      await conversationManager.logConversation(message, conversationResponse, conversationContext);
      
      return conversationResponse.response;
    }
  } catch (error) {
    logError('conversation manager', error);
  }
  // First, try neural network prediction
  try {
    const neuralResult = await neuralNetworkManager.getEnhancedPrediction(message, true);
    
    if (neuralResult.neuralPrediction && neuralResult.neuralPrediction.confidence > 0.8) {
      devLog(`Neural network match found: ${neuralResult.neuralPrediction.intentName} (confidence: ${neuralResult.neuralPrediction.confidence})`);
      
      // Get the response for this intent
      const intent = await prisma.trainingIntent.findUnique({
        where: { id: neuralResult.neuralPrediction.intentId },
        include: {
          responses: {
            where: { isActive: true },
            orderBy: { priority: 'desc' }
          }
        }
      });

      if (intent && intent.responses.length > 0) {
        let response = intent.responses[0].response;
        
        // Add personalization context if user is authenticated
        if (userContext?.firstName && !response.includes(userContext.firstName)) {
          response = response.replace(/^(Hi|Hello|Hey)/, `$1 ${userContext.firstName}`);
        }
        
        return response;
      }
    }
  } catch (error) {
    logError('neural network prediction', error);
  }

  // Fallback to traditional training data matching
  try {
    const trainingContext = {
      userId: userContext?.id,
      isAuthenticated: !!userContext,
      hasEnrolledPlan: !!userContext?.enrolledPlan,
      userGoals: userContext?.goals?.map(g => g.type) || [],
      sessionId
    };

    const trainingMatch = await trainingMatcher.findBestMatch(message, trainingContext);
    
    if (trainingMatch && trainingMatch.confidence > 0.7) {
      // Log successful training match
      devLog(`Fallback training match found: ${trainingMatch.intentName} (confidence: ${trainingMatch.confidence})`);
      
      // Add personalization context if user is authenticated
      let response = trainingMatch.response;
      if (userContext?.firstName && !response.includes(userContext.firstName)) {
        response = response.replace(/^(Hi|Hello|Hey)/, `$1 ${userContext.firstName}`);
      }
      
      return response;
    }
  } catch (error) {
    logError('training data matching', error);
  }

  // Try AI-powered response if no training match
  if (openai) {
    try {
      return await generateAIResponse(message, history, userContext, sessionId);
    } catch (error) {
      logError('AI response fallback', error);
    }
  }

  // Fallback to enhanced rule-based responses with memory
  return await generateEnhancedNutritionResponse(message.toLowerCase(), userContext, history);
}

async function generateAIResponse(
  message: string,
  history: ChatMessage[],
  userContext: UserContext | null,
  sessionId: string
): Promise<string> {
  // Query knowledge base for relevant information
  const knowledgeBase = await queryNutritionKnowledge(message, userContext);
  const systemPrompt = await createEnhancedSystemPrompt(userContext, sessionId, knowledgeBase);
  
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-20).map(msg => ({ // Include last 20 messages for better context
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ];

  const response = await openai!.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 600,
    temperature: 0.3,
    presence_penalty: 0.3, // Encourage diverse responses
    frequency_penalty: 0.2, // Reduce repetition
  });

  return response.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again!";
}

// New function to get or create chat session
async function getOrCreateChatSession(sessionId?: string, userId?: string) {
  if (sessionId) {
    // Try to find existing session
    const existingSession = await prisma.chatSession.findUnique({
      where: { sessionId }
    });
    if (existingSession) {
      return existingSession;
    }
  }

  // Create new session
  const newSessionId = sessionId || uuidv4();
  return await prisma.chatSession.create({
    data: {
      sessionId: newSessionId,
      userId: userId || null
    }
  });
}

// Get chat history from database
async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20 // Limit to last 20 messages for context
  });

  return messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));
}

// Store chat messages in database
async function storeChatMessages(
  sessionId: string, 
  userMessage: string, 
  botResponse: string, 
  userContext: UserContext | null
) {
  const userContextData = userContext ? {
    userId: userContext.id,
    firstName: userContext.firstName,
    enrolledPlan: userContext.enrolledPlan?.name,
    goals: userContext.goals?.map(g => ({ type: g.type, target: g.target }))
  } : null;

  await prisma.chatMessage.createMany({
    data: [
      {
        sessionId,
        role: 'user',
        content: userMessage,
        userContext: userContextData || undefined
      },
      {
        sessionId,
        role: 'assistant',
        content: botResponse,
        userContext: userContextData || undefined
      }
    ]
  });
}

// Enhanced system prompt with nutrition expertise
async function createEnhancedSystemPrompt(userContext: UserContext | null, sessionId: string, knowledgeBase?: string): Promise<string> {
  // Get user's past preferences and successful interactions
  const pastPreferences = await getUserPreferences(sessionId, userContext?.id);
  const enhancedPreferences = await getEnhancedUserPreferences(sessionId, userContext?.id);
  
  let prompt = `You are NutrisapBot, an expert AI nutrition assistant for NutriSap. You must provide ACCURATE, evidence-based nutrition information only. Your expertise includes:

CORE NUTRITION EXPERTISE:
- Clinical nutrition and dietetics (RD-level knowledge)
- Macronutrient balance and micronutrient optimization
- Evidence-based meal planning and dietary patterns
- Weight management (loss, gain, maintenance strategies)
- Sports nutrition and athletic performance optimization
- Medical nutrition therapy for common conditions
- Food science, nutrient bioavailability, and interactions
- Metabolic health, insulin sensitivity, and hormonal balance
- Digestive health, gut microbiome, and fermentation
- Special dietary needs (allergies, intolerances, medical restrictions)

SPECIALIZED NUTRITION KNOWLEDGE:
- Plant-based, ketogenic, Mediterranean, and other dietary patterns
- Intermittent fasting, meal timing, and chrono-nutrition
- Supplement science, dosing, and evidence-based recommendations
- Cultural cuisines with complete nutritional analysis
- Budget-friendly healthy eating and meal planning strategies
- Food safety, storage, preparation, and meal prep techniques
- Nutrition across life stages (infancy, pregnancy, aging, menopause)
- Psychology of eating, emotional eating, and behavioral change
- Nutrient density, food quality, and organic vs conventional foods
- Hydration science, electrolyte balance, and fluid needs

ADVANCED TOPICS YOU CAN HANDLE:
- Specific medical conditions (diabetes, heart disease, PCOS, etc.)
- Eating disorders and disordered eating patterns
- Food allergies, sensitivities, and elimination diets
- Nutrient deficiencies and their symptoms/solutions
- Exercise nutrition and pre/post-workout fueling
- Cooking techniques that preserve or enhance nutrition
- Reading nutrition labels and ingredient analysis
- Dietary supplements vs whole food sources
- Anti-inflammatory foods and oxidative stress
- Gut health, probiotics, prebiotics, and fermented foods

ACCURACY AND SAFETY REQUIREMENTS:
- ALWAYS provide evidence-based information from reputable sources
- NEVER guess or make up nutritional facts, values, or recommendations
- If you don't know something specific, acknowledge it and suggest consulting professionals
- Cross-reference information with established nutritional guidelines (FDA, WHO, RDA)
- Cite specific studies or organizations when making claims
- Be cautious with medical nutrition advice - always recommend healthcare consultation

COMMUNICATION STYLE:
- Be warm, supportive, and evidence-based in all responses
- Use clear, accessible language while avoiding excessive jargon
- Provide specific, actionable advice with practical steps
- Include relevant scientific context and credible sources when helpful
- Show empathy and understanding for user's challenges
- Keep responses comprehensive but under 500 words for readability
- Use emojis thoughtfully (1-3 per response max for engagement)
- Always recommend consulting healthcare professionals for medical concerns
- Ask follow-up questions to provide more personalized advice
- Acknowledge when questions are outside your scope but offer related help

RESPONSE GUIDELINES:
- Verify all nutritional facts before stating them
- Include practical examples and specific food recommendations with accurate nutritional data
- Mention portion sizes, timing, and preparation methods when relevant
- Address potential concerns or contraindications based on established research
- Provide both immediate and long-term strategies backed by evidence
- Always reference credible sources (FDA, WHO, peer-reviewed studies) when making specific claims
- If uncertain about specific values or recommendations, say so and suggest professional consultation
- Adapt complexity to user's apparent knowledge level while maintaining accuracy

MEMORY AND PERSONALIZATION:
- Remember user preferences, allergies, and past successful recommendations
- Build on previous conversations naturally and reference past topics
- Adapt communication style and complexity to user's knowledge level
- Track dietary progress, celebrate wins, and provide encouragement
- Consider user's cultural background and food preferences
- Tailor advice based on their goals, lifestyle, and constraints
- Remember their specific challenges and provide ongoing support

KEY CAPABILITIES:
- Answer ANY nutrition question, no matter how specific or complex
- Provide meal ideas, recipes, and cooking tips
- Explain the 'why' behind nutritional recommendations
- Help with grocery shopping, meal planning, and food budgeting
- Address nutrition myths and provide evidence-based corrections
- Support users with various dietary restrictions and preferences
- Offer alternatives and modifications for different needs
- Provide both quick tips and comprehensive guidance as needed`;

  if (pastPreferences.length > 0) {
    prompt += `\n\nUSER LEARNING DATA:\n${pastPreferences.map(p => `- ${p}`).join('\n')}`;
  }

  if (knowledgeBase) {
    prompt += `\n\nRELEVANT KNOWLEDGE BASE:\n${knowledgeBase}`;
  }

  // Add learned preferences
  const preferenceDetails = [];
  const prefs = enhancedPreferences as Record<string, Record<string, { value: string; confidence: number }>>;
  
  if (prefs.dietary?.plant_based?.confidence > 0.6) {
    preferenceDetails.push(`User shows interest in plant-based nutrition (confidence: ${prefs.dietary.plant_based.confidence})`);
  }
  if (prefs.goal_focus?.weight_loss?.confidence > 0.7) {
    preferenceDetails.push(`User is actively focused on weight loss (confidence: ${prefs.goal_focus.weight_loss.confidence})`);
  }
  if (prefs.goal_focus?.muscle_gain?.confidence > 0.7) {
    preferenceDetails.push(`User is actively focused on muscle gain (confidence: ${prefs.goal_focus.muscle_gain.confidence})`);
  }
  if (prefs.macro_focus?.high_protein?.confidence > 0.6) {
    preferenceDetails.push(`User is interested in high-protein foods (confidence: ${prefs.macro_focus.high_protein.confidence})`);
  }
  
  // Add food preferences
  const likedFoods = Object.keys(prefs.food_likes || {})
    .filter(food => prefs.food_likes[food].value === 'liked' && prefs.food_likes[food].confidence > 0.5);
  const dislikedFoods = Object.keys(prefs.food_likes || {})
    .filter(food => prefs.food_likes[food].value === 'disliked' && prefs.food_likes[food].confidence > 0.5);
    
  if (likedFoods.length > 0) {
    preferenceDetails.push(`User likes: ${likedFoods.join(', ')}`);
  }
  if (dislikedFoods.length > 0) {
    preferenceDetails.push(`User dislikes: ${dislikedFoods.join(', ')}`);
  }

  if (preferenceDetails.length > 0) {
    prompt += `\n\nLEARNED USER PREFERENCES:\n${preferenceDetails.map(p => `- ${p}`).join('\n')}`;
  }

  if (userContext) {
    prompt += `\n\nCURRENT USER PROFILE:
- Name: ${userContext.firstName}
- Age: ${userContext.age || 'Not specified'}
- Weight: ${userContext.weight ? userContext.weight + 'kg' : 'Not specified'}
- Height: ${userContext.height ? userContext.height + 'cm' : 'Not specified'}
- Gender: ${userContext.gender || 'Not specified'}
- Activity Level: ${userContext.activityLevel || 'Not specified'}`;

    // Calculate additional useful metrics
    if (userContext.weight && userContext.height) {
      const bmi = userContext.weight / Math.pow(userContext.height / 100, 2);
      const bmr = userContext.gender === 'MALE' 
        ? 88.362 + (13.397 * userContext.weight) + (4.799 * userContext.height) - (5.677 * (userContext.age || 30))
        : 447.593 + (9.247 * userContext.weight) + (3.098 * userContext.height) - (4.330 * (userContext.age || 30));
      prompt += `
- BMI: ${bmi.toFixed(1)} (calculated)
- Estimated BMR: ${Math.round(bmr)} calories/day`;
    }

    if (userContext.enrolledPlan) {
      prompt += `
- Current Plan: ${userContext.enrolledPlan.name} (${userContext.enrolledPlan.type})
- Daily Calories: ${userContext.enrolledPlan.calories}
- Meals per Day: ${userContext.enrolledPlan.mealsPerDay}`;
    }

    if (userContext.goals && userContext.goals.length > 0) {
      prompt += `\n- Active Goals: ${userContext.goals.map((g) => `${g.type}: ${g.target || 'Not set'}`).join(', ')}`;
    }

    prompt += `\n\nPersonalize all responses using this profile. Address the user by name occasionally, reference their plan/goals when relevant, and consider their physical stats for calorie/macro recommendations. Provide specific advice based on their activity level and any enrolled plan.`;
  } else {
    prompt += `\n\nThe user is not authenticated. Provide comprehensive general nutrition advice for their questions while gently encouraging them to sign up for personalized NutriSap plans when relevant. Still answer their questions thoroughly and helpfully.`;
  }

  return prompt;
}

// Get user preferences from past interactions
async function getUserPreferences(sessionId: string, userId?: string): Promise<string[]> {
  const preferences: string[] = [];
  
  try {
    // Get preferences from current session
    const sessionMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Analyze messages for preferences (simple keyword matching for now)
    sessionMessages.forEach(msg => {
      if (msg.role === 'user') {
        const content = msg.content.toLowerCase();
        if (content.includes('vegetarian') || content.includes('vegan')) {
          preferences.push('Prefers plant-based options');
        }
        if (content.includes('protein') && content.includes('high')) {
          preferences.push('Interested in high-protein foods');
        }
        if (content.includes('weight loss') || content.includes('lose weight')) {
          preferences.push('Focused on weight loss goals');
        }
        if (content.includes('muscle') || content.includes('gain')) {
          preferences.push('Interested in muscle building');
        }
      }
    });

    // Get preferences from user's other sessions if authenticated
    if (userId) {
      const userSessions = await prisma.chatSession.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        take: 3 // Last 3 sessions
      });

      userSessions.forEach(session => {
        session.messages.forEach(msg => {
          if (msg.role === 'user' && msg.content.toLowerCase().includes('love') || msg.content.toLowerCase().includes('favorite')) {
            preferences.push(`Previously mentioned: "${msg.content.substring(0, 50)}..."`);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error getting user preferences:', error);
  }

  return [...new Set(preferences)]; // Remove duplicates
}

// Query nutrition knowledge base for relevant information
async function queryNutritionKnowledge(message: string, userContext: UserContext | null): Promise<string> {
  const keywords = message.toLowerCase().split(' ');
  const relevantFacts: string[] = [];
  
  try {
    // Query nutrition facts
    const facts = await prisma.nutritionFact.findMany({
      where: {
        isActive: true,
        OR: [
          { tags: { hasSome: keywords } },
          { title: { contains: message.toLowerCase() } },
          { content: { contains: message.toLowerCase() } }
        ]
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    if (facts.length > 0) {
      relevantFacts.push(`**Nutrition Knowledge:**`);
      facts.forEach(fact => {
        relevantFacts.push(`• ${fact.title}: ${fact.content}`);
      });
    }

    // Query food database if user asks about specific foods
    if (keywords.some(k => ['calories', 'nutrition', 'protein', 'carbs', 'fat'].includes(k))) {
      const foods = await prisma.foodDatabase.findMany({
        where: {
          OR: [
            { name: { contains: message.toLowerCase() } },
            { tags: { hasSome: keywords } }
          ]
        },
        take: 2,
        orderBy: { name: 'asc' }
      });

      if (foods.length > 0) {
        if (relevantFacts.length === 0) relevantFacts.push(`**Food Information:**`);
        foods.forEach(food => {
          relevantFacts.push(`• **${food.name}** (per 100g): ${food.caloriesPer100g} cal, ${food.proteinPer100g}g protein, ${food.carbsPer100g}g carbs, ${food.fatPer100g}g fat`);
        });
      }
    }

    // Query recipes if user asks about meals or recipes
    if (keywords.some(k => ['recipe', 'meal', 'cook', 'prepare', 'breakfast', 'lunch', 'dinner'].includes(k))) {
      const goalTags = userContext?.enrolledPlan?.type === 'WEIGHT_LOSS' ? ['weight_loss'] : 
                      userContext?.enrolledPlan?.type === 'MUSCLE_GAIN' ? ['muscle_gain'] : [];
      
      const recipes = await prisma.recipeRecommendation.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: message.toLowerCase() } },
            { dietaryTags: { hasSome: keywords } },
            { goalTags: { hasSome: goalTags } }
          ]
        },
        take: 2,
        orderBy: { createdAt: 'desc' }
      });

      if (recipes.length > 0) {
        if (relevantFacts.length === 0) relevantFacts.push(`**Recipe Suggestions:**`);
        recipes.forEach(recipe => {
          relevantFacts.push(`• **${recipe.name}** (${recipe.prepTime + recipe.cookTime} min): ${recipe.calories} cal, ${recipe.protein}g protein - ${recipe.instructions.substring(0, 100)}...`);
        });
      }
    }

  } catch (error) {
    console.error('Error querying nutrition knowledge:', error);
  }

  return relevantFacts.join('\n');
}

// Learn from user interactions and store preferences
async function learnFromInteraction(
  message: string, 
  response: string, 
  sessionId: string, 
  userId?: string
) {
  try {
    const messageLower = message.toLowerCase();
    
    // Dietary preference learning
    if (messageLower.includes('vegetarian') || messageLower.includes('vegan')) {
      await upsertUserPreference(userId, sessionId, 'dietary', 'plant_based', 'interested', 0.8);
    }
    
    if (messageLower.includes('protein') && (messageLower.includes('more') || messageLower.includes('increase'))) {
      await upsertUserPreference(userId, sessionId, 'macro_focus', 'high_protein', 'interested', 0.7);
    }
    
    if (messageLower.includes('weight loss') || messageLower.includes('lose weight')) {
      await upsertUserPreference(userId, sessionId, 'goal_focus', 'weight_loss', 'active', 0.9);
    }
    
    if (messageLower.includes('muscle') || messageLower.includes('gain')) {
      await upsertUserPreference(userId, sessionId, 'goal_focus', 'muscle_gain', 'active', 0.9);
    }
    
    // Food preference learning
    const foodMentions = extractFoodMentions(messageLower);
    for (const food of foodMentions) {
      const sentiment = determineSentiment(messageLower, food);
      await upsertUserPreference(userId, sessionId, 'food_likes', food, sentiment, 0.6);
    }
    
    // Meal timing preferences
    if (messageLower.includes('breakfast') && messageLower.includes('skip')) {
      await upsertUserPreference(userId, sessionId, 'meal_timing', 'intermittent_fasting', 'interested', 0.7);
    }
    
  } catch (error) {
    console.error('Error learning from interaction:', error);
  }
}

// Upsert user preference with confidence scoring
async function upsertUserPreference(
  userId: string | undefined,
  sessionId: string,
  type: string,
  key: string,
  value: string,
  confidence: number
) {
  const whereClause = userId 
    ? { userId_preferenceType_preferenceKey: { userId, preferenceType: type, preferenceKey: key } }
    : { sessionId_preferenceType_preferenceKey: { sessionId, preferenceType: type, preferenceKey: key } };
    
  await prisma.userPreference.upsert({
    where: whereClause,
    update: {
      preferenceValue: value,
      confidence: Math.max(confidence, 0.1), // Increase confidence over time
      updatedAt: new Date()
    },
    create: {
      userId,
      sessionId: userId ? undefined : sessionId,
      preferenceType: type,
      preferenceKey: key,
      preferenceValue: value,
      confidence
    }
  });
}

// Extract food mentions from user message
function extractFoodMentions(message: string): string[] {
  const commonFoods = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
    'broccoli', 'spinach', 'carrot', 'potato', 'rice', 'pasta',
    'apple', 'banana', 'orange', 'berry', 'avocado',
    'cheese', 'yogurt', 'milk', 'egg', 'nuts', 'beans'
  ];
  
  return commonFoods.filter(food => message.includes(food));
}

// Determine sentiment about mentioned food
function determineSentiment(message: string, food: string): string {
  const foodContext = message.substring(
    Math.max(0, message.indexOf(food) - 20),
    message.indexOf(food) + food.length + 20
  );
  
  if (foodContext.includes('love') || foodContext.includes('favorite') || foodContext.includes('enjoy')) {
    return 'liked';
  } else if (foodContext.includes('hate') || foodContext.includes('dislike') || foodContext.includes('avoid')) {
    return 'disliked';
  } else if (foodContext.includes('want') || foodContext.includes('need') || foodContext.includes('should')) {
    return 'interested';
  }
  
  return 'neutral';
}

// Get enhanced user preferences for personalization
async function getEnhancedUserPreferences(sessionId: string, userId?: string): Promise<Record<string, unknown>> {
  const preferences: Record<string, unknown> = {
    dietary: {},
    food_likes: {},
    goal_focus: {},
    macro_focus: {},
    meal_timing: {}
  };
  
  try {
    const whereClause = userId 
      ? { userId }
      : { sessionId };
      
    const userPreferences = await prisma.userPreference.findMany({
      where: whereClause,
      orderBy: { confidence: 'desc' }
    });
    
    userPreferences.forEach(pref => {
      if (!preferences[pref.preferenceType]) {
        preferences[pref.preferenceType] = {};
      }
      (preferences[pref.preferenceType] as Record<string, { value: string; confidence: number }>)[pref.preferenceKey] = {
        value: pref.preferenceValue,
        confidence: pref.confidence
      };
    });
  } catch (error) {
    console.error('Error getting enhanced preferences:', error);
  }
  
  return preferences;
}


// BMI calculation helper functions
function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

function getBMICategory(bmi: number): { category: string; color: string; description: string } {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      color: '🔵',
      description: 'Below normal weight range. Consider consulting a healthcare provider about healthy weight gain strategies.'
    };
  } else if (bmi >= 18.5 && bmi < 25) {
    return {
      category: 'Normal weight',
      color: '🟢',
      description: 'Within healthy weight range. Focus on maintaining your current weight through balanced nutrition and regular activity.'
    };
  } else if (bmi >= 25 && bmi < 30) {
    return {
      category: 'Overweight',
      color: '🟡',
      description: 'Above normal weight range. Small lifestyle changes can help you reach a healthier weight.'
    };
  } else {
    return {
      category: 'Obesity',
      color: '🔴',
      description: 'Significantly above normal weight range. Consider consulting a healthcare provider for personalized guidance.'
    };
  }
}

function extractWeightHeight(message: string): { weight?: number; height?: number } {
  const result: { weight?: number; height?: number } = {};
  
  // Look for weight patterns (kg, lbs, pounds)
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i,
    /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)/i,
    /weight.{0,10}?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?).{0,5}?(?:kg|lbs?|pounds?)/i
  ];
  
  for (const pattern of weightPatterns) {
    const match = message.match(pattern);
    if (match) {
      let weight = parseFloat(match[1]);
      // Convert lbs to kg if needed
      if (message.toLowerCase().includes('lb') || message.toLowerCase().includes('pound')) {
        weight = weight * 0.453592;
      }
      result.weight = weight;
      break;
    }
  }
  
  // Look for height patterns (cm, ft/in, meters)
  const heightPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:cm|centimeters?)/i,
    /(\d+(?:\.\d+)?)\s*(?:m|meters?)/i,
    /(\d+)\s*(?:ft|feet|')\s*(\d+)\s*(?:in|inches?|")/i,
    /(\d+)\s*(?:ft|feet|')/i,
    /height.{0,10}?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?).{0,5}?(?:cm|ft|feet)/i
  ];
  
  for (const pattern of heightPatterns) {
    const match = message.match(pattern);
    if (match) {
      if (pattern.source.includes('ft')) {
        // Handle feet and inches
        const feet = parseInt(match[1]);
        const inches = match[2] ? parseInt(match[2]) : 0;
        result.height = (feet * 12 + inches) * 2.54; // Convert to cm
      } else if (message.toLowerCase().includes('m') && !message.toLowerCase().includes('cm')) {
        // Convert meters to cm
        result.height = parseFloat(match[1]) * 100;
      } else {
        result.height = parseFloat(match[1]);
      }
      break;
    }
  }
  
  return result;
}

function handleBMICalculation(message: string, userContext: UserContext | null, greeting: string): string {
  const extracted = extractWeightHeight(message);
  const weight = extracted.weight || userContext?.weight || null;
  const height = extracted.height || userContext?.height || null;
  
  // If we have both values, calculate BMI
  if (weight && height) {
    const bmi = calculateBMI(weight, height);
    const bmiInfo = getBMICategory(bmi);
    
    let response = `${greeting}Here's your BMI calculation:\n\n`;
    response += `📊 **Your BMI: ${bmi.toFixed(1)}**\n`;
    response += `${bmiInfo.color} **Category: ${bmiInfo.category}**\n\n`;
    response += `**What this means:**\n${bmiInfo.description}\n\n`;
    
    // Add personalized recommendations based on BMI category
    if (bmi < 18.5) {
      response += `**Nutrition Tips for Healthy Weight Gain:**\n`;
      response += `• Focus on nutrient-dense, calorie-rich foods\n`;
      response += `• Include healthy fats (nuts, avocados, olive oil)\n`;
      response += `• Eat frequent, smaller meals throughout the day\n`;
      response += `• Add protein-rich snacks between meals\n`;
      response += `• Consider strength training to build muscle mass\n\n`;
    } else if (bmi >= 25) {
      response += `**Nutrition Tips for Healthy Weight Management:**\n`;
      response += `• Create a moderate calorie deficit (300-500 calories)\n`;
      response += `• Focus on whole, unprocessed foods\n`;
      response += `• Fill half your plate with vegetables\n`;
      response += `• Choose lean proteins and complex carbohydrates\n`;
      response += `• Stay hydrated and limit sugary drinks\n`;
      response += `• Practice portion control\n\n`;
    } else {
      response += `**Tips for Maintaining Healthy Weight:**\n`;
      response += `• Continue eating a balanced, varied diet\n`;
      response += `• Stay active with regular exercise\n`;
      response += `• Monitor your weight regularly\n`;
      response += `• Focus on overall health, not just the number on the scale\n\n`;
    }
    
    response += `**Important Notes:**\n`;
    response += `• BMI is a general indicator and doesn't account for muscle mass, bone density, or body composition\n`;
    response += `• Athletes or very muscular individuals may have higher BMIs due to muscle weight\n`;
    response += `• For personalized advice, consult with a healthcare provider or registered dietitian\n\n`;
    
    if (userContext?.enrolledPlan) {
      response += `💡 Your ${userContext.enrolledPlan.name} plan is designed to support your health goals. Would you like meal suggestions that align with your BMI category?`;
    } else {
      response += `💡 Consider enrolling in one of our personalized diet plans for tailored nutrition guidance based on your BMI and health goals!`;
    }
    
    return response;
  }
  
  // If missing information, guide user on how to calculate
  let response = `${greeting}I'd be happy to help you calculate your BMI! `;
  
  if (userContext?.weight && userContext?.height) {
    // User has profile data, calculate automatically
    const bmi = calculateBMI(userContext.weight, userContext.height);
    const bmiInfo = getBMICategory(bmi);
    
    response = `${greeting}Based on your profile (${userContext.weight}kg, ${userContext.height}cm):\n\n`;
    response += `📊 **Your BMI: ${bmi.toFixed(1)}**\n`;
    response += `${bmiInfo.color} **Category: ${bmiInfo.category}**\n\n`;
    response += `${bmiInfo.description}\n\n`;
    response += `Would you like personalized nutrition recommendations based on your BMI?`;
    
    return response;
  }
  
  // Guide user on providing information
  if (!weight && !height) {
    response += `To calculate your BMI, I need your weight and height.\n\n`;
    response += `**You can tell me like this:**\n`;
    response += `• "I weigh 70kg and I'm 175cm tall"\n`;
    response += `• "My weight is 150 lbs and height is 5'8""\n`;
    response += `• "Calculate BMI for 65kg and 160cm"\n\n`;
  } else if (!weight) {
    response += `I have your height (${height}cm), but I need your weight to calculate BMI.\n\n`;
    response += `**Tell me your weight like:**\n`;
    response += `• "I weigh 70kg" or "My weight is 150 lbs"\n\n`;
  } else if (!height) {
    response += `I have your weight (${weight}kg), but I need your height to calculate BMI.\n\n`;
    response += `**Tell me your height like:**\n`;
    response += `• "I'm 175cm tall" or "My height is 5'8""\n\n`;
  }
  
  response += `**What is BMI?**\n`;
  response += `Body Mass Index (BMI) is a measure that uses your height and weight to work out if your weight is healthy. It's calculated as weight (kg) divided by height (m) squared.\n\n`;
  response += `**BMI Categories:**\n`;
  response += `🔵 Under 18.5: Underweight\n`;
  response += `🟢 18.5-24.9: Normal weight\n`;
  response += `🟡 25.0-29.9: Overweight\n`;
  response += `🔴 30.0+: Obesity\n\n`;
  
  if (!userContext) {
    response += `💡 Sign up for NutriSap to save your measurements and get personalized nutrition plans!`;
  }
  
  return response;
}

async function generateEnhancedNutritionResponse(message: string, userContext: UserContext | null, history: ChatMessage[]): Promise<string> {
  const userName = userContext?.firstName || '';
  const greeting = userName ? `Hi ${userName}! ` : '';
  
  // Analyze conversation history for context and patterns
  const previousTopics = history.slice(-8).map(msg => msg.content.toLowerCase());
  const recentUserMessages = history.slice(-4).filter(msg => msg.role === 'user').map(msg => msg.content.toLowerCase());
  const hasDiscussedWeightLoss = previousTopics.some(topic => topic.includes('weight loss') || topic.includes('lose weight'));
  const hasDiscussedMuscle = previousTopics.some(topic => topic.includes('muscle') || topic.includes('protein'));
  const hasDiscussedSupplements = previousTopics.some(topic => topic.includes('supplement') || topic.includes('vitamin'));
  const hasDiscussedMealPlan = previousTopics.some(topic => topic.includes('meal') || topic.includes('plan') || topic.includes('diet'));
  
  // Check if user seems confused or needs different approach
  const seemsConfused = recentUserMessages.some(msg => 
    msg.includes('don\'t understand') || msg.includes('confused') || msg.includes('what') || msg.includes('unclear')
  );
  
  // Check for urgency or specific needs
  const isUrgent = message.includes('urgent') || message.includes('help') || message.includes('problem');
  const needsSimple = message.includes('simple') || message.includes('easy') || message.includes('basic');
  
  // Current time for time-based responses
  const currentHour = new Date().getHours();
  const isEarlyMorning = currentHour < 7;
  const isMealTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 12 && currentHour <= 14) || (currentHour >= 18 && currentHour <= 20);
  
  // Enhanced rule-based responses with comprehensive nutrition knowledge
  
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    let response = greeting;
    
    // Time-based greeting
    if (isEarlyMorning) {
      response += "Good early morning! Starting your day with nutrition planning?";
    } else if (isMealTime) {
      response += "Perfect timing! Planning a nutritious meal?";
    } else {
      response += "I'm NutrisapBot, your nutrition assistant from NutriSap.";
    }
    
    if (userContext) {
      if (userContext.enrolledPlan) {
        response += ` I see you're on our ${userContext.enrolledPlan.name} plan - excellent choice!`;
        if (isMealTime) {
          response += ` Ready to explore some meal options from your plan?`;
        }
      } else {
        response += ' Have you considered one of our personalized diet plans? They can really help streamline your nutrition goals.';
      }
      
      // Add context based on previous conversations
      if (hasDiscussedWeightLoss) {
        response += " Ready to continue working on those weight loss goals?";
      } else if (hasDiscussedMuscle) {
        response += " Shall we dive deeper into your muscle-building nutrition?";
      } else if (hasDiscussedMealPlan) {
        response += " Want to explore more meal planning strategies?";
      } else {
        response += " How can I help with your nutrition journey today?";
      }
    } else {
      response += " I'm here to help with meal planning, nutrition advice, and healthy eating tips. Consider signing up for personalized diet plans! What nutrition topic interests you?";
    }
    
    return response;
  }
  
  if (message.includes('meal plan') || message.includes('diet plan')) {
    if (userContext?.enrolledPlan) {
      const plan = userContext.enrolledPlan;
      return `${greeting}You're currently on our ${plan.name} plan (${plan.calories} calories/day with ${plan.mealsPerDay} meals). Here are today's meal suggestions:\n\n${plan.meals?.slice(0, 3).map((meal, i: number) => 
        `${i + 1}. **${meal.name}** (${meal.calories} cal)\n   ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fat}g fat`
      ).join('\n\n') || 'Loading your meal details...'}\n\nWould you like recipe details for any of these meals?`;
    } else if (userContext) {
      return `${greeting}I'd love to help you find the perfect diet plan! Based on your profile, I can recommend:\n\n🎯 **Weight Loss Plan**: Balanced, calorie-controlled meals\n💪 **Muscle Gain Plan**: High-protein, energy-rich options\n⚖️ **Maintenance Plan**: Balanced nutrition for current goals\n\nWould you like to learn more about any of these plans or enroll in one?`;
    }
    return "We offer several specialized diet plans:\n\n🎯 **Weight Loss**: Balanced, calorie-controlled meals\n💪 **Muscle Gain**: High-protein, energy-rich options\n⚖️ **Maintenance**: Balanced nutrition for current goals\n\nSign up for NutriSap to get a personalized plan tailored to your specific needs and goals!";
  }

  if (message.includes('weight loss') || message.includes('lose weight')) {
    let response = hasDiscussedWeightLoss 
      ? `${greeting}Following up on our weight loss discussion - here are additional tips:\n\n• Progress tracking (weekly weigh-ins, measurements)\n• Managing plateaus with calorie cycling\n• Incorporating strength training to preserve muscle\n• Addressing emotional eating triggers`
      : `${greeting}For healthy weight loss, focus on:\n\n• Creating a moderate calorie deficit (300-500 calories)\n• Eating nutrient-dense, whole foods\n• Including lean proteins and plenty of vegetables\n• Staying hydrated and getting adequate sleep`;
    
    if (userContext?.weight && userContext?.height) {
      const bmi = userContext.weight / Math.pow(userContext.height / 100, 2);
      response += `\n\nBased on your current stats (${userContext.weight}kg, ${userContext.height}cm), your BMI is ${bmi.toFixed(1)}.`;
    }
    
    if (!userContext?.enrolledPlan) {
      response += `\n\n💡 Consider our Weight Loss Plan for personalized meal planning and guidance!`;
    }
    
    return response;
  }

  if (message.includes('muscle gain') || message.includes('build muscle')) {
    let response = hasDiscussedMuscle 
      ? `${greeting}Building on our muscle-building chat - here's more advanced guidance:\n\n• Progressive overload in both training and nutrition\n• Meal timing: spread protein across 3-4 meals\n• Consider creatine supplementation (3-5g daily)\n• Track strength gains alongside body composition`
      : `${greeting}For muscle gain, prioritize:\n\n• Adequate protein (0.8-1g per lb body weight)\n• Complex carbohydrates for energy\n• Healthy fats for hormone production\n• Post-workout nutrition within 30 minutes`;
    
    if (userContext?.weight) {
      const proteinNeeds = Math.round(userContext.weight * 2.2 * 0.9); // Convert kg to lbs, then calculate
      response += `\n\nBased on your weight (${userContext.weight}kg), aim for about ${proteinNeeds}g protein daily.`;
    }
    
    if (!userContext?.enrolledPlan) {
      response += `\n\n💪 Our Muscle Gain Plan provides optimized high-protein meals - perfect for your goals!`;
    }
    
    return response;
  }

  if (message.includes('my plan') || message.includes('enrolled plan') || message.includes('current plan')) {
    if (userContext?.enrolledPlan) {
      const plan = userContext.enrolledPlan;
      return `${greeting}You're enrolled in our **${plan.name}**!\n\n📊 **Plan Details:**\n• Type: ${plan.type.replace('_', ' ')}\n• Daily calories: ${plan.calories}\n• Meals per day: ${plan.mealsPerDay}\n• Duration: ${plan.duration} days\n\n🍽️ You have ${plan.meals?.length || 0} meals in your plan. Would you like to see today's recommendations?`;
    } else if (userContext) {
      return `${greeting}You're not currently enrolled in a diet plan. Would you like me to recommend one based on your goals? We have Weight Loss, Muscle Gain, and Maintenance plans available!`;
    }
    return "You'll need to sign up and enroll in a plan to get personalized meal recommendations. Check out our diet plans to get started!";
  }

  if (message.includes('profile') || message.includes('my info')) {
    if (userContext) {
      return `${greeting}Here's your profile summary:\n\n👤 **Personal Info:**\n• Age: ${userContext.age || 'Not set'}\n• Weight: ${userContext.weight ? userContext.weight + 'kg' : 'Not set'}\n• Height: ${userContext.height ? userContext.height + 'cm' : 'Not set'}\n• Activity: ${userContext.activityLevel?.replace('_', ' ') || 'Not set'}\n\n📋 **Plan:** ${userContext.enrolledPlan?.name || 'None enrolled'}\n\nTo update your profile, visit your account settings!`;
    }
    return "Please sign up or log in to view your personalized profile and nutrition recommendations!";
  }
  // Comprehensive nutrition topic responses
  if (message.includes('vitamin') || message.includes('supplement')) {
    let response = hasDiscussedSupplements 
      ? `${greeting}Continuing our supplement discussion - here are key points about vitamin supplementation:\n\n• **Vitamin D**: Most people benefit from 1000-2000 IU daily, especially in winter months\n• **B12**: Essential for vegans and vegetarians (2.4 mcg daily)\n• **Omega-3**: Consider algae-based or fish oil if not eating fatty fish 2x/week\n• **Multivitamin**: Can fill nutrient gaps but focus on whole foods first`
      : `${greeting}Great question about vitamins and supplements! Here's evidence-based guidance:\n\n🥗 **Food First Approach**: Aim to get nutrients from whole foods when possible\n\n**Common Beneficial Supplements:**\n• Vitamin D (especially if limited sun exposure)\n• B12 (for plant-based eaters)\n• Omega-3 fatty acids\n• Magnesium (if dietary intake is low)\n\n⚠️ Always consult your healthcare provider before starting new supplements, especially if you have medical conditions or take medications.`;
    
    if (!hasDiscussedSupplements) {
      response += `\n\n💡 Would you like specific guidance on any particular vitamin or supplement?`;
    }
    return response;
  }

  if (message.includes('hydration') || message.includes('water') || message.includes('drink')) {
    return `${greeting}Hydration is crucial for optimal health! Here's what you need to know:\n\n💧 **Daily Fluid Needs:**\n• General guideline: 8-10 cups (2-2.5L) daily\n• More if you're active, in hot weather, or pregnant/breastfeeding\n• Monitor urine color - pale yellow indicates good hydration\n\n**Best Hydration Sources:**\n• Plain water (best choice)\n• Herbal teas and sparkling water\n• Water-rich foods (cucumbers, watermelon, soups)\n\n🚫 **Limit**: Sugary drinks, excessive caffeine, and alcohol\n\n💡 Pro tip: Start your day with a glass of water and keep a water bottle nearby as a reminder!`;
  }

  if (message.includes('carb') || message.includes('carbohydrate')) {
    return `${greeting}Carbohydrates are your body's preferred energy source! Here's the complete guide:\n\n**Types of Carbs:**\n🌾 **Complex Carbs** (Choose these!): Whole grains, legumes, vegetables\n🍬 **Simple Carbs**: Fruits (good), added sugars (limit)\n\n**Daily Recommendations:**\n• 45-65% of total calories from carbs\n• Focus on fiber-rich sources (25-35g fiber daily)\n• Time carbs around workouts for energy\n\n**Best Sources:**\n• Oats, quinoa, brown rice, sweet potatoes\n• Fruits and vegetables\n• Legumes and lentils\n\n${userContext?.enrolledPlan ? `Based on your ${userContext.enrolledPlan.name} plan, aim for balanced carb intake throughout the day.` : 'Consider timing carbs around your most active periods!'}`;
  }

  if (message.includes('protein') && !hasDiscussedMuscle) {
    const proteinNeeds = userContext?.weight ? Math.round(userContext.weight * 0.8 * 2.2) : 50;
    return `${greeting}Protein is essential for muscle maintenance, immune function, and satiety!\n\n**Daily Protein Needs:**\n• General: 0.8g per kg body weight\n• Active individuals: 1.2-2.0g per kg\n• ${userContext?.weight ? `For you: approximately ${proteinNeeds}g daily` : 'Calculate: weight in kg × 0.8-1.2g'}\n\n**Complete Protein Sources:**\n🥩 **Animal**: Chicken, fish, eggs, Greek yogurt\n🌱 **Plant**: Quinoa, soy products, hemp seeds\n\n**Protein Combining** (for plant-based):\n• Beans + rice\n• Nuts + seeds\n• Hummus + whole grain pita\n\n💡 Spread protein throughout the day for optimal absorption!`;
  }

  if (message.includes('fiber') || message.includes('digestion') || message.includes('gut health')) {
    return `${greeting}Fiber and gut health are fundamental to overall wellness!\n\n**Fiber Benefits:**\n• Improved digestion and regularity\n• Better blood sugar control\n• Heart health support\n• Increased satiety for weight management\n\n**Daily Fiber Goals:**\n• Women: 25g daily\n• Men: 38g daily\n\n**Best Fiber Sources:**\n🥗 **Soluble**: Oats, apples, beans (feeds good bacteria)\n🌾 **Insoluble**: Whole grains, vegetables (promotes regularity)\n\n**Gut Health Tips:**\n• Include fermented foods (yogurt, kimchi, kefir)\n• Eat diverse plant foods (aim for 30 different plants/week)\n• Stay hydrated\n• Manage stress levels\n\n⚠️ Increase fiber gradually to avoid digestive discomfort!`;
  }

  if (message.includes('meal prep') || message.includes('meal planning')) {
    return `${greeting}Meal prep is a game-changer for healthy eating! Here's your complete guide:\n\n**Weekly Meal Prep Strategy:**\n📅 **Sunday Prep Day**:\n• Plan 3-4 meals for the week\n• Grocery shop with a list\n• Batch cook proteins and grains\n\n**Prep-Friendly Foods:**\n• **Proteins**: Grilled chicken, baked salmon, hard-boiled eggs\n• **Carbs**: Brown rice, quinoa, roasted sweet potatoes\n• **Vegetables**: Roasted veggies, pre-cut raw vegetables\n\n**Storage Tips:**\n🥗 Mason jars for salads (dressing on bottom)\n🍱 Glass containers for balanced meals\n❄️ Freeze portions for busy weeks\n\n**Time-Saving Hacks:**\n• Use a slow cooker or Instant Pot\n• Pre-cut vegetables when you get home from shopping\n• Make double portions for leftovers\n\n${userContext?.enrolledPlan ? `Your ${userContext.enrolledPlan.name} plan meals are perfect for batch preparation!` : 'Start with prepping just 2-3 meals to build the habit!'}`;
  }

  if (message.includes('keto') || message.includes('ketogenic')) {
    return `${greeting}The ketogenic diet is a high-fat, very low-carb approach. Here's what you need to know:\n\n**Keto Macros:**\n• 70-80% calories from fat\n• 15-25% from protein\n• 5-10% from carbs (typically 20-50g daily)\n\n**Foods to Emphasize:**\n🥑 **Healthy Fats**: Avocados, olive oil, nuts, seeds\n🥩 **Proteins**: Fish, poultry, eggs, meat\n🥬 **Low-carb vegetables**: Leafy greens, broccoli, cauliflower\n\n**Potential Benefits:**\n• Rapid initial weight loss\n• Improved blood sugar control\n• Increased satiety\n\n**Considerations:**\n⚠️ Can cause initial fatigue ("keto flu")\n⚠️ May affect athletic performance initially\n⚠️ Requires careful planning for nutrient adequacy\n\n💡 Consult a healthcare provider before starting, especially if you have medical conditions. Consider a less restrictive approach like Mediterranean diet for long-term sustainability!`;
  }

  if (message.includes('intermittent fasting') || message.includes('fasting')) {
    return `${greeting}Intermittent fasting (IF) focuses on *when* you eat rather than *what* you eat:\n\n**Popular IF Methods:**\n⏰ **16:8**: Fast 16 hours, eat within 8-hour window\n📅 **5:2**: Eat normally 5 days, restrict calories 2 days\n🌅 **OMAD**: One meal a day\n\n**Potential Benefits:**\n• Simplified meal planning\n• May support weight management\n• Possible metabolic benefits\n• Can improve insulin sensitivity\n\n**Who Should Avoid IF:**\n❌ Pregnant/breastfeeding women\n❌ History of eating disorders\n❌ Certain medical conditions\n❌ Children and teenagers\n\n**Getting Started:**\n1. Start with 12:12 and gradually extend fasting window\n2. Stay hydrated during fasting periods\n3. Focus on nutrient-dense foods during eating windows\n4. Listen to your body - stop if you feel unwell\n\n💡 IF isn't magic - total calorie intake and food quality still matter most!`;
  }

  if (message.includes('diabetes') || message.includes('blood sugar')) {
    return `${greeting}Blood sugar management is crucial for health! Here are evidence-based nutrition strategies:\n\n**Blood Sugar Friendly Foods:**\n🥗 **Low Glycemic**: Non-starchy vegetables, berries, nuts\n🌾 **Complex Carbs**: Oats, quinoa, legumes\n🥩 **Lean Proteins**: Fish, chicken, tofu\n🥑 **Healthy Fats**: Avocado, olive oil, nuts\n\n**Meal Timing Tips:**\n• Eat regular, balanced meals\n• Pair carbs with protein/fat to slow absorption\n• Consider smaller, more frequent meals\n• Stay consistent with meal timing\n\n**Portion Control:**\n• Use the plate method: 1/2 vegetables, 1/4 protein, 1/4 carbs\n• Monitor portion sizes of carb-containing foods\n• Include fiber-rich foods for better blood sugar control\n\n⚠️ **Important**: This is general nutrition information. For diabetes management, work closely with your healthcare team and a registered dietitian for personalized guidance!\n\n💡 Regular physical activity also helps with blood sugar control!`;
  }

  if (message.includes('cholesterol') || message.includes('heart health')) {
    return `${greeting}Heart-healthy nutrition can significantly impact cholesterol levels and cardiovascular health:\n\n**Foods That Lower Cholesterol:**\n🥣 **Soluble Fiber**: Oats, beans, apples, barley\n🐟 **Omega-3 Rich Fish**: Salmon, mackerel, sardines (2x/week)\n🌰 **Nuts**: Almonds, walnuts (handful daily)\n🥑 **Healthy Fats**: Avocados, olive oil, olives\n\n**Foods to Limit:**\n❌ **Saturated Fats**: Reduce red meat, full-fat dairy\n❌ **Trans Fats**: Avoid processed foods with "partially hydrogenated" oils\n❌ **Excess Sugar**: Limit added sugars and refined carbs\n\n**Heart-Healthy Eating Pattern:**\n🌿 **Mediterranean Style**: Emphasizes plants, fish, olive oil\n• Lots of vegetables and fruits\n• Whole grains over refined\n• Moderate amounts of fish and poultry\n• Limited red meat\n\n**Additional Tips:**\n• Maintain healthy weight\n• Stay physically active\n• Manage stress levels\n• Don't smoke\n\n💡 Small, consistent changes can make significant improvements in heart health over time!`;
  }

  // BMI calculation functionality
  if (message.includes('bmi') || message.includes('body mass index') || 
      (message.includes('calculate') && (message.includes('weight') || message.includes('height')))) {
    return handleBMICalculation(message, userContext, greeting);
  }

  if (message.includes('thank') || message.includes('thanks')) {
    return `You're welcome${userName ? `, ${userName}` : ''}! I'm here whenever you need nutrition advice or healthy eating tips. Remember, small consistent changes lead to big results. Keep up the great work on your health journey! 🌟`;
  }
  
  // Enhanced contextual default response
  return generateContextualDefaultResponse(message, userContext, history, {
    hasDiscussedWeightLoss,
    hasDiscussedMuscle, 
    hasDiscussedSupplements,
    hasDiscussedMealPlan,
    seemsConfused,
    isUrgent,
    needsSimple,
    isMealTime,
    greeting
  });
}

function generateContextualDefaultResponse(
  message: string,
  userContext: UserContext | null,
  history: ChatMessage[],
  context: {
    hasDiscussedWeightLoss: boolean;
    hasDiscussedMuscle: boolean;
    hasDiscussedSupplements: boolean;
    hasDiscussedMealPlan: boolean;
    seemsConfused: boolean;
    isUrgent: boolean;
    needsSimple: boolean;
    isMealTime: boolean;
    greeting: string;
  }
): string {
  const { 
    hasDiscussedWeightLoss, hasDiscussedMuscle, hasDiscussedSupplements, 
    hasDiscussedMealPlan, seemsConfused, isUrgent, needsSimple, isMealTime, greeting 
  } = context;

  // Handle confused users with simpler approach
  if (seemsConfused || needsSimple) {
    return `${greeting}I can see you might want a simpler approach! Let me help you step by step. Here are some easy ways to get started:\n\n🍎 **Simple Questions You Can Ask:**\n• "What should I eat for breakfast?"\n• "How much water should I drink?"\n• "What are healthy snacks?"\n• "How can I eat more vegetables?"\n\n💡 Try asking one specific question at a time, and I'll give you clear, easy-to-follow advice!`;
  }

  // Handle urgent requests
  if (isUrgent) {
    let response = `${greeting}I'm here to help right away! For urgent health concerns, please consult a healthcare professional immediately.\n\n`;
    response += `For **nutrition emergencies** I can help with:\n• Food safety questions\n• Dietary restrictions guidance\n• Quick meal solutions\n• Emergency meal planning\n\nWhat specific nutrition help do you need right now?`;
    return response;
  }

  let response = greeting;
  
  // Contextual opening based on conversation history
  if (hasDiscussedWeightLoss && hasDiscussedMealPlan) {
    response += "It looks like you're really focused on weight loss and meal planning - that's fantastic! ";
  } else if (hasDiscussedMuscle && hasDiscussedSupplements) {
    response += "I can see you're serious about muscle building and nutrition optimization - great approach! ";
  } else if (hasDiscussedMealPlan) {
    response += "I love that you're thinking about meal planning - it's one of the best ways to improve nutrition! ";
  } else if (history.length > 5) {
    response += "We've been having a great conversation about nutrition! ";
  } else {
    response += "I'm excited to help you with your nutrition questions! ";
  }

  // Time-based suggestions
  if (isMealTime) {
    response += "Since it's meal time, would you like some quick meal ideas or recipe suggestions? ";
  }

  // Personalized suggestions based on user context
  if (userContext) {
    response += `\n\n**Personalized Options for You:**\n`;
    
    if (userContext.enrolledPlan) {
      response += `• Explore your ${userContext.enrolledPlan.name} meal options\n`;
      response += `• Get recipes from your plan\n`;
      response += `• Track your progress\n`;
    } else {
      response += `• Get a personalized diet plan recommendation\n`;
      response += `• Calculate your BMI and nutritional needs\n`;
      response += `• Learn about meal plans that fit your goals\n`;
    }

    if (userContext.goals && userContext.goals.length > 0) {
      const goalTypes = userContext.goals.map(g => g.type).join(', ');
      response += `• Nutrition advice for your ${goalTypes} goals\n`;
    }
  }

  // Smart topic suggestions based on conversation history
  response += `\n**Popular Topics to Explore:**\n`;
  
  if (!hasDiscussedWeightLoss) {
    response += `• Weight management strategies\n`;
  }
  if (!hasDiscussedMuscle) {
    response += `• Muscle building nutrition\n`;
  }
  if (!hasDiscussedMealPlan) {
    response += `• Meal planning and prep tips\n`;
  }
  if (!hasDiscussedSupplements) {
    response += `• Vitamins and supplements guidance\n`;
  }
  
  response += `• BMI calculator and health insights\n`;
  response += `• Specific diet approaches (keto, Mediterranean, etc.)\n`;

  // Conversation starters
  response += `\n**Easy Ways to Get Started:**\n`;
  response += `• "Help me plan healthy meals"\n`;
  response += `• "What should I know about protein?"\n`;
  response += `• "Calculate my BMI"\n`;
  response += `• "I want to lose weight naturally"\n`;

  if (!userContext) {
    response += `\n💡 **Pro Tip:** Sign up for NutriSap to get personalized meal plans and save your preferences!`;
  }

  response += `\n\nWhat nutrition topic would you like to explore together?`;

  return response;
}