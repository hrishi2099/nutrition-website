import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message }: { message: string; history?: ChatMessage[] } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simple response logic - in production, you might use OpenAI API or similar
    const response = generateNutritionResponse(message.toLowerCase());

    return NextResponse.json({
      success: true,
      response,
      botName: 'NutrisapBot'
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function generateNutritionResponse(message: string): string {
  // Simple rule-based responses - in production, integrate with AI service
  
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! I'm NutrisapBot, your nutrition assistant. I'm here to help with meal planning, nutrition advice, and healthy eating tips. What can I help you with today?";
  }
  
  if (message.includes('weight loss') || message.includes('lose weight')) {
    return "For healthy weight loss, focus on creating a moderate calorie deficit through:\n\n• Eating nutrient-dense, whole foods\n• Including lean proteins (chicken, fish, legumes)\n• Adding plenty of vegetables and fruits\n• Staying hydrated\n• Combining diet with regular exercise\n\nWould you like me to suggest a specific meal plan or recipe?";
  }
  
  if (message.includes('muscle gain') || message.includes('build muscle')) {
    return "For muscle gain, prioritize:\n\n• Adequate protein intake (0.8-1g per lb body weight)\n• Complex carbohydrates for energy\n• Healthy fats for hormone production\n• Post-workout nutrition within 30 minutes\n• Consistent meal timing\n\nGreat protein sources include eggs, lean meats, Greek yogurt, and plant-based options like quinoa and lentils. Need specific meal ideas?";
  }
  
  if (message.includes('calories') || message.includes('calorie')) {
    return "Calorie needs vary by individual based on age, gender, activity level, and goals. Here's a general guide:\n\n• Sedentary adults: 1,800-2,400 calories/day\n• Active adults: 2,200-2,800 calories/day\n• Weight loss: 500-750 calorie deficit\n• Muscle gain: 200-500 calorie surplus\n\nFor personalized recommendations, consider consulting our diet plans or a nutritionist!";
  }
  
  if (message.includes('meal plan') || message.includes('diet plan')) {
    return "We offer several specialized diet plans:\n\n🎯 **Weight Loss**: Balanced, calorie-controlled meals\n💪 **Muscle Gain**: High-protein, energy-rich options\n⚖️ **Maintenance**: Balanced nutrition for current goals\n🏃 **Athletic Performance**: Optimized for fitness enthusiasts\n\nEach plan includes detailed meal schedules, recipes, and shopping lists. Would you like to know more about any specific plan?";
  }
  
  if (message.includes('protein') || message.includes('proteins')) {
    return "Excellent protein sources include:\n\n**Animal-based:**\n• Lean meats (chicken, turkey, beef)\n• Fish and seafood\n• Eggs and dairy products\n\n**Plant-based:**\n• Legumes (beans, lentils, chickpeas)\n• Quinoa and hemp seeds\n• Nuts and nut butters\n• Tofu and tempeh\n\nAim for protein at every meal for optimal muscle maintenance and satiety!";
  }
  
  if (message.includes('water') || message.includes('hydration')) {
    return "Proper hydration is crucial for health! Guidelines:\n\n• Aim for 8-10 glasses (64-80oz) of water daily\n• Increase intake during exercise or hot weather\n• Start your day with a glass of water\n• Eat water-rich foods (cucumber, watermelon, soups)\n• Monitor urine color - pale yellow indicates good hydration\n\nProper hydration supports metabolism, energy levels, and overall health!";
  }
  
  if (message.includes('recipe') || message.includes('recipes')) {
    return "I'd love to help with healthy recipes! Here are some quick, nutritious ideas:\n\n🥗 **Quinoa Power Bowl**: Quinoa, roasted vegetables, chickpeas, tahini dressing\n🐟 **Baked Salmon**: With sweet potato and steamed broccoli\n🥤 **Green Smoothie**: Spinach, banana, berries, Greek yogurt, almond milk\n🍳 **Veggie Scramble**: Eggs with bell peppers, spinach, and feta cheese\n\nWould you like the detailed recipe for any of these, or do you have specific dietary preferences?";
  }
  
  if (message.includes('snack') || message.includes('snacks')) {
    return "Here are some healthy snack ideas:\n\n🥜 **Protein-rich**: Greek yogurt with berries, nuts, or hard-boiled eggs\n🥕 **Fiber-packed**: Apple with almond butter, carrot sticks with hummus\n🧀 **Balanced**: Whole grain crackers with cheese\n🥤 **Refreshing**: Smoothie with protein powder\n\nTiming matters too - eat snacks 2-3 hours between meals to maintain energy levels!";
  }
  
  if (message.includes('vegetarian') || message.includes('vegan')) {
    return "Plant-based nutrition can be incredibly healthy! Focus on:\n\n• **Protein variety**: Combine legumes, grains, nuts, and seeds\n• **Iron-rich foods**: Spinach, lentils, quinoa (pair with vitamin C)\n• **B12 supplement**: Essential for vegans\n• **Omega-3s**: Flax seeds, chia seeds, walnuts\n• **Calcium sources**: Leafy greens, fortified plant milks, tahini\n\nWould you like specific vegetarian meal ideas or tips for meeting nutritional needs?";
  }
  
  if (message.includes('thank') || message.includes('thanks')) {
    return "You're welcome! I'm here whenever you need nutrition advice or healthy eating tips. Remember, small consistent changes lead to big results. Keep up the great work on your health journey! 🌟";
  }
  
  // Default response
  return "I'm here to help with nutrition and healthy eating! You can ask me about:\n\n• Meal planning and recipes\n• Weight management tips\n• Protein sources and macros\n• Healthy snack ideas\n• Diet plan recommendations\n• Hydration and general nutrition\n\nWhat specific nutrition topic would you like to explore?";
}