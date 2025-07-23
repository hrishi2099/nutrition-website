import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
  console.log('OpenAI not configured, using rule-based responses');
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId }: { message: string; sessionId?: string } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
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
      console.error('Learning error:', err)
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
    console.error('Chatbot API error:', error);
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

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
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
    console.error('Error getting user context:', error);
    return null;
  }
}

async function generateIntelligentResponse(
  message: string, 
  history: ChatMessage[], 
  userContext: UserContext | null,
  sessionId: string
): Promise<string> {
  // Try AI-powered response first
  if (openai) {
    try {
      return await generateAIResponse(message, history, userContext, sessionId);
    } catch (error) {
      console.error('AI response failed, falling back to rule-based:', error);
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
    ...history.slice(-10).map(msg => ({ // Include last 10 messages for better context
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user' as const, content: message }
  ];

  const response = await openai!.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 600,
    temperature: 0.7,
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
        userContext: userContextData as Record<string, unknown> | null
      },
      {
        sessionId,
        role: 'assistant',
        content: botResponse,
        userContext: userContextData as Record<string, unknown> | null
      }
    ]
  });
}

// Enhanced system prompt with nutrition expertise
async function createEnhancedSystemPrompt(userContext: UserContext | null, sessionId: string, knowledgeBase?: string): Promise<string> {
  // Get user's past preferences and successful interactions
  const pastPreferences = await getUserPreferences(sessionId, userContext?.id);
  const enhancedPreferences = await getEnhancedUserPreferences(sessionId, userContext?.id);
  
  let prompt = `You are NutrisapBot, an expert AI nutrition assistant for NutriSap with comprehensive knowledge in:

CORE EXPERTISE:
- Clinical nutrition and dietetics
- Macronutrient balance and micronutrient optimization
- Evidence-based meal planning and dietary patterns
- Weight management (loss, gain, maintenance)
- Sports nutrition and performance
- Medical nutrition therapy basics
- Food science and nutrient interactions
- Metabolic health and hormonal balance
- Digestive health and gut microbiome
- Special dietary needs (allergies, intolerances, restrictions)

SPECIALIZED KNOWLEDGE:
- Plant-based and omnivorous nutrition
- Intermittent fasting and meal timing
- Supplement science and recommendations
- Cultural and ethnic cuisines with nutritional analysis
- Budget-friendly healthy eating strategies
- Meal prep and food safety
- Nutrition for different life stages (pregnancy, aging, etc.)
- Emotional eating and behavioral change

COMMUNICATION STYLE:
- Be warm, supportive, and evidence-based
- Use clear, accessible language avoiding jargon
- Provide specific, actionable advice
- Include relevant scientific context when helpful
- Show empathy and understanding
- Keep responses under 400 words
- Use emojis sparingly (1-2 per response max)
- Always recommend consulting healthcare professionals for medical concerns

MEMORY AND LEARNING:
- Remember user preferences and past successful recommendations
- Build on previous conversations naturally
- Adapt communication style to user's knowledge level
- Track dietary progress and celebrate wins`;

  if (pastPreferences.length > 0) {
    prompt += `\n\nUSER LEARNING DATA:\n${pastPreferences.map(p => `- ${p}`).join('\n')}`;
  }

  if (knowledgeBase) {
    prompt += `\n\nRELEVANT KNOWLEDGE BASE:\n${knowledgeBase}`;
  }

  // Add learned preferences
  const preferenceDetails = [];
  if (enhancedPreferences.dietary.plant_based?.confidence > 0.6) {
    preferenceDetails.push(`User shows interest in plant-based nutrition (confidence: ${enhancedPreferences.dietary.plant_based.confidence})`);
  }
  if (enhancedPreferences.goal_focus.weight_loss?.confidence > 0.7) {
    preferenceDetails.push(`User is actively focused on weight loss (confidence: ${enhancedPreferences.goal_focus.weight_loss.confidence})`);
  }
  if (enhancedPreferences.goal_focus.muscle_gain?.confidence > 0.7) {
    preferenceDetails.push(`User is actively focused on muscle gain (confidence: ${enhancedPreferences.goal_focus.muscle_gain.confidence})`);
  }
  if (enhancedPreferences.macro_focus.high_protein?.confidence > 0.6) {
    preferenceDetails.push(`User is interested in high-protein foods (confidence: ${enhancedPreferences.macro_focus.high_protein.confidence})`);
  }
  
  // Add food preferences
  const likedFoods = Object.keys(enhancedPreferences.food_likes || {})
    .filter(food => enhancedPreferences.food_likes[food].value === 'liked' && enhancedPreferences.food_likes[food].confidence > 0.5);
  const dislikedFoods = Object.keys(enhancedPreferences.food_likes || {})
    .filter(food => enhancedPreferences.food_likes[food].value === 'disliked' && enhancedPreferences.food_likes[food].confidence > 0.5);
    
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

    if (userContext.enrolledPlan) {
      prompt += `
- Current Plan: ${userContext.enrolledPlan.name} (${userContext.enrolledPlan.type})
- Daily Calories: ${userContext.enrolledPlan.calories}
- Meals per Day: ${userContext.enrolledPlan.mealsPerDay}`;
    }

    if (userContext.goals && userContext.goals.length > 0) {
      prompt += `\n- Active Goals: ${userContext.goals.map((g) => `${g.type}: ${g.target || 'Not set'}`).join(', ')}`;
    }

    prompt += `\n\nPersonalize all responses using this profile. Address the user by name occasionally and reference their plan/goals when relevant.`;
  } else {
    prompt += `\n\nThe user is not authenticated. Provide general nutrition advice and gently encourage them to sign up for personalized NutriSap plans.`;
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
    ? { userId, preferenceType: type, preferenceKey: key }
    : { sessionId, preferenceType: type, preferenceKey: key };
    
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
      preferences[pref.preferenceType][pref.preferenceKey] = {
        value: pref.preferenceValue,
        confidence: pref.confidence
      };
    });
  } catch (error) {
    console.error('Error getting enhanced preferences:', error);
  }
  
  return preferences;
}


async function generateEnhancedNutritionResponse(message: string, userContext: UserContext | null, history: ChatMessage[]): Promise<string> {
  const userName = userContext?.firstName || '';
  const greeting = userName ? `Hi ${userName}! ` : '';
  
  // Analyze conversation history for context
  const previousTopics = history.slice(-6).map(msg => msg.content.toLowerCase());
  const hasDiscussedWeightLoss = previousTopics.some(topic => topic.includes('weight loss') || topic.includes('lose weight'));
  const hasDiscussedMuscle = previousTopics.some(topic => topic.includes('muscle') || topic.includes('protein'));
  // const hasDiscussedMeals = previousTopics.some(topic => topic.includes('meal') || topic.includes('recipe'));
  
  // Enhanced rule-based responses with personalization and memory
  
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    if (userContext) {
      const planInfo = userContext.enrolledPlan 
        ? ` I can see you're enrolled in our ${userContext.enrolledPlan.name} plan - that's great!`
        : ' Have you considered enrolling in one of our personalized diet plans?';
      return `${greeting}I'm NutrisapBot, your personal nutrition assistant from NutriSap.${planInfo} How can I help with your nutrition journey today?`;
    }
    return "Hello! I'm NutrisapBot, your nutrition assistant from NutriSap. I'm here to help with meal planning, nutrition advice, and healthy eating tips. Consider signing up for personalized diet plans! What can I help you with today?";
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
  if (message.includes('thank') || message.includes('thanks')) {
    return `You're welcome${userName ? `, ${userName}` : ''}! I'm here whenever you need nutrition advice or healthy eating tips. Remember, small consistent changes lead to big results. Keep up the great work on your health journey! 🌟`;
  }
  
  // Default response with personalization
  if (userContext) {
    return `${greeting}I'm here to help with your nutrition journey! You can ask me about:\n\n• Your current meal plan and recommendations\n• Personalized weight management tips\n• Protein and macro guidance\n• Healthy recipes and snack ideas\n• Your profile and goals\n• General nutrition advice\n\nWhat would you like to know about your health and nutrition?`;
  }
  
  return "I'm here to help with nutrition and healthy eating! You can ask me about:\n\n• Meal planning and recipes\n• Weight management tips\n• Protein sources and macros\n• Healthy snack ideas\n• Diet plan recommendations\n• Hydration and general nutrition\n\n💡 Sign up for NutriSap to get personalized advice based on your goals and preferences!\n\nWhat specific nutrition topic would you like to explore?";
}