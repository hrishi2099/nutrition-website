const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleTrainingData = [
  {
    intentName: 'weight_loss_advice',
    description: 'User asking for weight loss advice',
    category: 'nutrition',
    examples: [
      'How can I lose weight?',
      'What foods help with weight loss?',
      'I want to lose 10 pounds',
      'Help me create a weight loss plan',
      'What exercises are good for losing weight?',
      'How many calories should I eat to lose weight?',
      'What is the best diet for weight loss?',
      'I need to shed some pounds',
      'Can you help me lose belly fat?',
      'What are some healthy weight loss tips?'
    ],
    responses: [
      {
        response: 'For healthy weight loss, focus on creating a moderate calorie deficit through a combination of nutritious eating and regular physical activity. Aim to lose 1-2 pounds per week by reducing your daily calories by 300-500. Include plenty of vegetables, lean proteins, and whole grains in your diet while staying hydrated and getting adequate sleep.',
        responseType: 'advice',
        priority: 1
      }
    ]
  },
  {
    intentName: 'muscle_gain_advice',
    description: 'User asking for muscle building advice',
    category: 'nutrition',
    examples: [
      'How do I build muscle?',
      'What foods help build muscle?',
      'I want to gain muscle mass',
      'Best protein foods for muscle growth',
      'How much protein do I need to build muscle?',
      'What exercises build muscle?',
      'Help me create a muscle building plan',
      'I want to get stronger',
      'How to gain muscle and lose fat?',
      'What supplements help with muscle growth?'
    ],
    responses: [
      {
        response: 'To build muscle effectively, focus on consuming adequate protein (0.8-1g per lb of body weight), performing resistance training 3-4 times per week, and ensuring proper recovery. Include lean meats, fish, eggs, dairy, legumes, and nuts in your diet. Timing your protein intake throughout the day and staying consistent with your training routine are key factors for muscle growth.',
        responseType: 'advice',
        priority: 1
      }
    ]
  },
  {
    intentName: 'meal_planning',
    description: 'User asking about meal planning',
    category: 'nutrition',
    examples: [
      'How do I plan my meals?',
      'Help me with meal prep',
      'What should I eat for breakfast?',
      'Can you suggest healthy meals?',
      'I need a meal plan',
      'What are some nutritious recipes?',
      'How to meal prep for the week?',
      'Healthy lunch ideas',
      'What should I cook for dinner?',
      'Easy healthy meal ideas'
    ],
    responses: [
      {
        response: 'Effective meal planning starts with choosing a variety of nutritious foods from all food groups. Plan your meals around lean proteins, colorful vegetables, whole grains, and healthy fats. Batch cooking on weekends, using versatile ingredients, and keeping healthy snacks on hand can make meal planning more manageable. Consider your schedule, preferences, and nutritional goals when creating your weekly meal plan.',
        responseType: 'advice',
        priority: 1
      }
    ]
  },
  {
    intentName: 'nutrition_facts',
    description: 'User asking about nutrition facts or specific nutrients',
    category: 'nutrition',
    examples: [
      'What vitamins do I need?',
      'Tell me about protein',
      'How much fiber should I eat?',
      'What are macronutrients?',
      'Benefits of omega-3 fatty acids',
      'Do I need supplements?',
      'What foods are high in iron?',
      'How much water should I drink?',
      'What are antioxidants?',
      'Tell me about carbohydrates'
    ],
    responses: [
      {
        response: 'Nutrition facts can help you make informed food choices. Key nutrients include macronutrients (proteins, carbohydrates, fats) and micronutrients (vitamins and minerals). Focus on getting nutrients from whole foods first, then consider supplements if needed. Reading nutrition labels, understanding serving sizes, and knowing your individual needs based on age, gender, activity level, and health goals are essential for optimal nutrition.',
        responseType: 'information',
        priority: 1
      }
    ]
  },
  {
    intentName: 'diet_types',
    description: 'User asking about different diet types',
    category: 'nutrition',
    examples: [
      'What is the keto diet?',
      'Tell me about Mediterranean diet',
      'Is intermittent fasting good?',
      'What is a vegan diet?',
      'Paleo diet benefits',
      'Low carb vs low fat diet',
      'What is the DASH diet?',
      'Plant-based diet information',
      'Is the carnivore diet healthy?',
      'Which diet is best for me?'
    ],
    responses: [
      {
        response: 'There are many dietary approaches, each with different principles and benefits. Popular diets include Mediterranean (emphasizes whole foods, olive oil, fish), Keto (very low carb, high fat), Plant-based (emphasizes plants, may include animal products), and DASH (designed for heart health). The best diet is one that is sustainable, meets your nutritional needs, aligns with your health goals, and fits your lifestyle. Consider consulting with a healthcare provider or registered dietitian to find the right approach for you.',
        responseType: 'information',
        priority: 1
      }
    ]
  },
  {
    intentName: 'bmi_calculation',
    description: 'User asking about BMI calculation',
    category: 'health',
    examples: [
      'Calculate my BMI',
      'What is BMI?',
      'How do I calculate body mass index?',
      'Is my BMI healthy?',
      'BMI calculator',
      'What does my BMI mean?',
      'How to check if I am overweight?',
      'Body mass index explanation',
      'BMI categories',
      'What is a healthy BMI range?'
    ],
    responses: [
      {
        response: 'BMI (Body Mass Index) is calculated by dividing your weight in kilograms by your height in meters squared. BMI categories are: Underweight (<18.5), Normal weight (18.5-24.9), Overweight (25.0-29.9), and Obesity (≥30.0). To calculate your BMI, I would need your height and weight. For example, tell me "I weigh 70kg and I am 175cm tall" and I can calculate your BMI and provide personalized recommendations.',
        responseType: 'information',
        priority: 1
      }
    ]
  }
];

async function initializeNeuralNetwork() {
  try {
    console.log('🧠 Initializing Neural Network Training Data...');

    for (const intentData of sampleTrainingData) {
      console.log(`Creating intent: ${intentData.intentName}`);

      // Create or update the intent
      const intent = await prisma.trainingIntent.upsert({
        where: { name: intentData.intentName },
        update: {
          description: intentData.description,
          category: intentData.category,
          priority: 1,
          isActive: true
        },
        create: {
          name: intentData.intentName,
          description: intentData.description,
          category: intentData.category,
          priority: 1,
          isActive: true
        }
      });

      console.log(`✅ Intent created: ${intent.id}`);

      // Add training examples
      for (const example of intentData.examples) {
        // Check if example already exists
        const existingExample = await prisma.trainingExample.findFirst({
          where: {
            intentId: intent.id,
            userInput: example
          }
        });

        if (!existingExample) {
          await prisma.trainingExample.create({
            data: {
              intentId: intent.id,
              userInput: example,
              keywords: example.toLowerCase().split(' ').filter(word => word.length > 2),
              confidence: 1.0,
              isActive: true
            }
          });
        }
      }

      console.log(`✅ Added ${intentData.examples.length} training examples`);

      // Add responses
      for (const responseData of intentData.responses) {
        // Check if response already exists
        const existingResponse = await prisma.trainingResponse.findFirst({
          where: {
            intentId: intent.id,
            response: responseData.response
          }
        });

        if (!existingResponse) {
          await prisma.trainingResponse.create({
            data: {
              intentId: intent.id,
              response: responseData.response,
              responseType: responseData.responseType,
              priority: responseData.priority,
              isActive: true
            }
          });
        }
      }

      console.log(`✅ Added ${intentData.responses.length} responses`);
    }

    // Get statistics
    const stats = await prisma.trainingIntent.count({ where: { isActive: true } });
    const exampleCount = await prisma.trainingExample.count({ where: { isActive: true } });
    const responseCount = await prisma.trainingResponse.count({ where: { isActive: true } });

    console.log(`\n🎉 Neural Network Training Data Initialized Successfully!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Intents: ${stats}`);
    console.log(`   - Training Examples: ${exampleCount}`);
    console.log(`   - Responses: ${responseCount}`);
    console.log(`\n🚀 You can now train the neural network from the admin panel!`);
    console.log(`   Visit: /admin/neural-network`);

  } catch (error) {
    console.error('❌ Error initializing neural network:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeNeuralNetwork()
  .catch((error) => {
    console.error('Failed to initialize neural network:', error);
    process.exit(1);
  });