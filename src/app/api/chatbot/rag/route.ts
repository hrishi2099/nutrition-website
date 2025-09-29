// Enhanced Chatbot API with Local RAG (No GPT-4)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { validateChatMessage } from '@/lib/validation';
import { devLog, logError } from '@/lib/logger';
import { ragEnhancedChatbot } from '@/lib/rag/ragIntegration';
import { localNutritionRAG } from '@/lib/rag/localRAG';

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

    // Initialize RAG enhanced chatbot
    await ragEnhancedChatbot.initialize();

    // Generate RAG-enhanced response
    const ragResponse = await ragEnhancedChatbot.generateRAGResponse(
      message,
      userContext,
      conversationHistory
    );

    // If RAG confidence is low, fall back to existing system
    let finalResponse = ragResponse.response;
    let responseMethod = ragResponse.ragUsed ? 'RAG' : 'Fallback';

    if (ragResponse.confidence < 0.6) {
      // Try existing chatbot systems
      try {
        const fallbackResponse = await generateFallbackResponse(
          message,
          conversationHistory,
          userContext,
          session.id
        );

        if (fallbackResponse.confidence > ragResponse.confidence) {
          finalResponse = fallbackResponse.response;
          responseMethod = fallbackResponse.method;
        }
      } catch (error) {
        logError('Fallback response generation', error);
        // Keep RAG response if fallback fails
      }
    }

    // Store user message and bot response in database
    await storeChatMessages(session.id, message, finalResponse, userContext);

    // Learn from user interaction (run in background)
    learnFromInteraction(message, finalResponse, session.id, userContext?.id).catch(err =>
      logError('chatbot learning', err)
    );

    // Log RAG performance metrics
    devLog(`RAG Chatbot - Method: ${responseMethod}, Confidence: ${ragResponse.confidence}, Search Time: ${ragResponse.searchTime}ms, Documents: ${ragResponse.documentsFound}`);

    return NextResponse.json({
      success: true,
      response: finalResponse,
      sessionId: session.sessionId,
      botName: 'NutrisapBot',
      metadata: {
        ragUsed: ragResponse.ragUsed,
        confidence: ragResponse.confidence,
        searchTime: ragResponse.searchTime,
        documentsFound: ragResponse.documentsFound,
        responseMethod
      },
      userContext: userContext ? {
        isAuthenticated: true,
        firstName: userContext.firstName,
        hasEnrolledPlan: !!userContext.enrolledPlan
      } : { isAuthenticated: false }
    });

  } catch (error) {
    logError('RAG chatbot API', error, { message: message?.substring(0, 100), sessionId });
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

async function generateFallbackResponse(
  message: string,
  history: ChatMessage[],
  userContext: UserContext | null,
  sessionId: string
): Promise<{ response: string; confidence: number; method: string }> {
  // Import existing chatbot systems
  const { trainingMatcher } = await import('@/lib/chatbotTraining');
  const { neuralNetworkManager } = await import('@/lib/neuralNetwork/neuralNetworkManager');
  const { conversationManager } = await import('@/lib/conversationManager');

  // Try conversation manager first
  try {
    const conversationContext = {
      userId: userContext?.id,
      sessionId,
      firstName: userContext?.firstName,
      enrolledPlan: userContext?.enrolledPlan,
      goals: userContext?.goals?.map(goal => ({
        id: goal.id,
        type: goal.type,
        target: goal.target ?? undefined,
        deadline: undefined
      })),
      previousMessages: history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date()
      }))
    };

    const conversationResponse = await conversationManager.analyzeAndRespond(message, conversationContext);

    if (conversationResponse.confidence > 0.7) {
      await conversationManager.logConversation(message, conversationResponse, conversationContext);
      return {
        response: conversationResponse.response,
        confidence: conversationResponse.confidence,
        method: 'Conversation Manager'
      };
    }
  } catch (error) {
    logError('conversation manager fallback', error);
  }

  // Try neural network
  try {
    const neuralResult = await neuralNetworkManager.getEnhancedPrediction(message, true);

    if (neuralResult.neuralPrediction && neuralResult.neuralPrediction.confidence > 0.8) {
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

        if (userContext?.firstName && !response.includes(userContext.firstName)) {
          response = response.replace(/^(Hi|Hello|Hey)/, `$1 ${userContext.firstName}`);
        }

        return {
          response,
          confidence: neuralResult.neuralPrediction.confidence,
          method: 'Neural Network'
        };
      }
    }
  } catch (error) {
    logError('neural network fallback', error);
  }

  // Try training data matcher
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
      let response = trainingMatch.response;
      if (userContext?.firstName && !response.includes(userContext.firstName)) {
        response = response.replace(/^(Hi|Hello|Hey)/, `$1 ${userContext.firstName}`);
      }

      return {
        response,
        confidence: trainingMatch.confidence,
        method: 'Training Data'
      };
    }
  } catch (error) {
    logError('training data fallback', error);
  }

  // Final fallback to rule-based system
  const ruleBasedResponse = await generateRuleBasedResponse(message, userContext, history);
  return {
    response: ruleBasedResponse,
    confidence: 0.5,
    method: 'Rule-Based'
  };
}

async function generateRuleBasedResponse(
  message: string,
  userContext: UserContext | null,
  history: ChatMessage[]
): Promise<string> {
  const userName = userContext?.firstName || '';
  const greeting = userName ? `Hi ${userName}! ` : '';
  const messageLower = message.toLowerCase();

  // Simple rule-based responses for common queries
  if (messageLower.includes('hello') || messageLower.includes('hi')) {
    let response = greeting + "I'm NutrisapBot, your nutrition assistant.";

    if (userContext?.enrolledPlan) {
      response += ` I see you're on our ${userContext.enrolledPlan.name} plan - great choice!`;
    }

    response += " How can I help with your nutrition questions today?";
    return response;
  }

  if (messageLower.includes('calorie') || messageLower.includes('bmi')) {
    if (userContext?.weight && userContext?.height) {
      const bmi = userContext.weight / Math.pow(userContext.height / 100, 2);
      return `${greeting}Based on your profile (${userContext.weight}kg, ${userContext.height}cm), your BMI is ${bmi.toFixed(1)}. For detailed nutrition advice, I'd be happy to help with specific questions!`;
    }
    return `${greeting}I can help with calorie calculations and BMI. Please let me know your weight and height, or ask about specific nutrition topics!`;
  }

  if (messageLower.includes('protein')) {
    return `${greeting}Protein is essential for muscle maintenance and overall health. Most adults need about 0.8-1.2g per kg of body weight daily. Good sources include lean meats, fish, eggs, dairy, legumes, and nuts. Would you like specific protein recommendations for your goals?`;
  }

  if (messageLower.includes('weight loss')) {
    return `${greeting}For healthy weight loss, focus on creating a moderate calorie deficit through balanced nutrition and exercise. Aim for 0.5-1 pound loss per week. Include plenty of protein, fiber-rich foods, and stay hydrated. Would you like specific meal planning tips?`;
  }

  if (messageLower.includes('meal plan') || messageLower.includes('diet plan')) {
    if (userContext?.enrolledPlan) {
      return `${greeting}You're currently on our ${userContext.enrolledPlan.name} plan with ${userContext.enrolledPlan.calories} calories per day. How can I help you with your meal planning today?`;
    }
    return `${greeting}I can help with meal planning! Consider our personalized diet plans for structured guidance, or ask me about specific nutrition topics like protein requirements, meal timing, or healthy recipes.`;
  }

  // Generic helpful response
  return `${greeting}I'm here to help with all your nutrition questions! I can assist with meal planning, calorie calculations, macro nutrients, supplements, and healthy eating tips. What specific nutrition topic would you like to explore?`;
}

async function getOrCreateChatSession(sessionId?: string, userId?: string) {
  if (sessionId) {
    const existingSession = await prisma.chatSession.findUnique({
      where: { sessionId }
    });
    if (existingSession) {
      return existingSession;
    }
  }

  const newSessionId = sessionId || uuidv4();
  return await prisma.chatSession.create({
    data: {
      sessionId: newSessionId,
      userId: userId || null
    }
  });
}

async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: 20
  });

  return messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));
}

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

async function learnFromInteraction(
  message: string,
  response: string,
  sessionId: string,
  userId?: string
) {
  try {
    const messageLower = message.toLowerCase();

    // Simple preference learning (extend as needed)
    if (messageLower.includes('vegetarian') || messageLower.includes('vegan')) {
      await upsertUserPreference(userId, sessionId, 'dietary', 'plant_based', 'interested', 0.8);
    }

    if (messageLower.includes('protein') && (messageLower.includes('more') || messageLower.includes('increase'))) {
      await upsertUserPreference(userId, sessionId, 'macro_focus', 'high_protein', 'interested', 0.7);
    }

    if (messageLower.includes('weight loss') || messageLower.includes('lose weight')) {
      await upsertUserPreference(userId, sessionId, 'goal_focus', 'weight_loss', 'active', 0.9);
    }
  } catch (error) {
    logError('Learning from interaction', error);
  }
}

async function upsertUserPreference(
  userId: string | undefined,
  sessionId: string,
  type: string,
  key: string,
  value: string,
  confidence: number
) {
  try {
    const whereClause = userId
      ? { userId_preferenceType_preferenceKey: { userId, preferenceType: type, preferenceKey: key } }
      : { sessionId_preferenceType_preferenceKey: { sessionId, preferenceType: type, preferenceKey: key } };

    await prisma.userPreference.upsert({
      where: whereClause,
      update: {
        preferenceValue: value,
        confidence: Math.max(confidence, 0.1),
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
  } catch (error) {
    logError('Upserting user preference', error);
  }
}