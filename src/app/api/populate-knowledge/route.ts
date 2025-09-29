// API endpoint to populate RAG knowledge base
import { NextRequest, NextResponse } from 'next/server';
import { localNutritionRAG, type NutritionDocument } from '@/lib/rag/localRAG';
import { devLog, logError } from '@/lib/logger';

// Comprehensive nutrition knowledge base
const NUTRITION_KNOWLEDGE: NutritionDocument[] = [
  {
    id: 'protein-basics',
    content: 'Protein is essential for muscle building, tissue repair, and immune function. Complete proteins contain all nine essential amino acids and include meat, fish, eggs, dairy, quinoa, and soy products like tofu. Adults need 0.8-1.2 grams of protein per kilogram of body weight daily. Athletes and elderly individuals may require 1.2-2.0 grams per kilogram. Good protein sources include chicken breast (31g per 100g), salmon (25g per 100g), eggs (13g per 100g), Greek yogurt (10g per 100g), lentils (9g per 100g), and quinoa (4.4g per 100g).',
    metadata: {
      type: 'nutrition_fact',
      title: 'Protein Requirements and Sources',
      source: 'Nutritional Guidelines',
      tags: ['protein', 'amino-acids', 'muscle-building', 'daily-requirements'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.95
    }
  },
  {
    id: 'omega-3-benefits',
    content: 'Omega-3 fatty acids are essential fats that reduce inflammation, support heart health, improve brain function, and may help prevent depression. The three main types are EPA, DHA (found in fish), and ALA (found in plants). Adults should aim for 250-500mg of EPA and DHA daily. Best sources include fatty fish like salmon (1.8g per 100g), mackerel (2.6g per 100g), sardines (1.5g per 100g), walnuts (2.5g per 30g), flaxseeds (1.6g per tablespoon), chia seeds (1.2g per tablespoon), and algae-based supplements for vegetarians.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Omega-3 Fatty Acids Benefits and Sources',
      source: 'Cardiovascular Research',
      tags: ['omega-3', 'heart-health', 'brain-health', 'inflammation', 'fish-oil'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },
  {
    id: 'fiber-importance',
    content: 'Dietary fiber supports digestive health, helps control blood sugar levels, lowers cholesterol, and promotes satiety for weight management. Adults need 25-35 grams daily, but most consume only half this amount. Soluble fiber (found in oats, beans, apples) helps lower cholesterol and blood sugar. Insoluble fiber (found in whole grains, vegetables) aids digestion. High-fiber foods include raspberries (8g per cup), artichokes (10g per medium), split peas (16g per cup), lentils (15g per cup), black beans (15g per cup), and whole grains.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Dietary Fiber Benefits and Requirements',
      source: 'Digestive Health Research',
      tags: ['fiber', 'digestion', 'blood-sugar', 'cholesterol', 'weight-management'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },
  {
    id: 'vitamin-d-deficiency',
    content: 'Vitamin D is crucial for bone health, immune function, and mood regulation. Many people are deficient, especially in winter months or with limited sun exposure. The body produces vitamin D when skin is exposed to UVB radiation. Dietary sources include fatty fish (salmon, mackerel), egg yolks, fortified dairy products, and mushrooms. Adults need 600-800 IU daily, but those with deficiency may need 1000-4000 IU. Symptoms of deficiency include fatigue, bone pain, muscle weakness, and frequent infections.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Vitamin D Deficiency and Sources',
      source: 'Endocrinology Research',
      tags: ['vitamin-d', 'bone-health', 'immune-system', 'deficiency', 'supplements'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.85
    }
  },
  {
    id: 'antioxidant-foods',
    content: 'Antioxidants protect cells from oxidative stress and may reduce risk of chronic diseases including cancer and heart disease. The most powerful antioxidants include vitamin C, vitamin E, beta-carotene, lycopene, and flavonoids. Foods highest in antioxidants include blueberries, dark chocolate (70%+ cacao), pecans, strawberries, artichokes, goji berries, raspberries, kale, red cabbage, and green tea. Eating a variety of colorful fruits and vegetables ensures a wide range of antioxidants.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Antioxidant Foods and Disease Prevention',
      source: 'Nutritional Science',
      tags: ['antioxidants', 'disease-prevention', 'fruits', 'vegetables', 'cell-protection'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.85
    }
  },
  {
    id: 'hydration-needs',
    content: 'Proper hydration is essential for all bodily functions including temperature regulation, joint lubrication, and nutrient transport. Adults need approximately 8-10 cups (2-2.5 liters) of fluids daily, more with exercise, hot weather, or illness. Water needs vary based on body size, activity level, and climate. Signs of good hydration include pale yellow urine and sustained energy levels. Besides water, hydrating foods include watermelon (92% water), cucumber (96% water), lettuce (95% water), and soups.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Daily Hydration Requirements',
      source: 'Sports Nutrition',
      tags: ['hydration', 'water', 'daily-requirements', 'performance', 'health'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },
  {
    id: 'meal-timing-strategy',
    content: 'Meal timing affects metabolism, energy levels, and workout performance. Eating regular meals every 3-4 hours helps maintain stable blood sugar and prevents overeating. Pre-workout meals should emphasize easily digestible carbohydrates (banana, oatmeal) 1-2 hours before exercise. Post-workout nutrition should include protein and carbohydrates within 30-60 minutes for optimal recovery. Examples include chocolate milk, Greek yogurt with berries, or a protein smoothie.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Optimal Meal Timing for Performance',
      source: 'Sports Nutrition Research',
      tags: ['meal-timing', 'metabolism', 'workout-nutrition', 'blood-sugar', 'recovery'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.8
    }
  },
  {
    id: 'portion-control-methods',
    content: 'Portion control is key for weight management and preventing overeating. Use the plate method: fill half your plate with vegetables, one quarter with lean protein, and one quarter with whole grains. Hand-based portions: protein serving equals palm size, carbohydrates equal cupped hand, fats equal thumb size, vegetables equal fist size. Eating slowly, using smaller plates, and paying attention to hunger cues also help control portions.',
    metadata: {
      type: 'nutrition_fact',
      title: 'Portion Control Strategies',
      source: 'Weight Management Research',
      tags: ['portion-control', 'weight-management', 'plate-method', 'serving-sizes'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.85
    }
  },

  // Specific food information
  {
    id: 'salmon-nutrition',
    content: 'Salmon is an excellent source of high-quality protein and omega-3 fatty acids. A 100g serving contains approximately 208 calories, 25g protein, 12g fat (rich in EPA and DHA), zero carbohydrates. It provides vitamin D (360-700 IU), vitamin B12, selenium, and potassium. Wild-caught salmon typically has higher omega-3 content than farmed. Salmon supports heart health, brain function, and may reduce inflammation. Best preparation methods include baking, grilling, or pan-searing.',
    metadata: {
      type: 'food_data',
      title: 'Salmon Nutrition Profile',
      source: 'Food Database',
      tags: ['salmon', 'omega-3', 'protein', 'fish', 'heart-healthy'],
      calories: 208,
      macros: { protein: 25, carbs: 0, fat: 12 },
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },
  {
    id: 'avocado-nutrition',
    content: 'Avocados are nutrient-dense fruits rich in healthy monounsaturated fats. One medium avocado (150g) contains 234 calories, 4g protein, 21g fat (mostly oleic acid), 12g carbohydrates, and 10g fiber. They provide potassium (690mg), folate, vitamin K, vitamin E, and vitamin C. Avocados help increase absorption of fat-soluble vitamins from other foods and may help lower cholesterol. They support heart health and weight management due to their fiber and healthy fat content.',
    metadata: {
      type: 'food_data',
      title: 'Avocado Nutrition Benefits',
      source: 'Food Database',
      tags: ['avocado', 'healthy-fats', 'fiber', 'potassium', 'heart-health'],
      calories: 234,
      macros: { protein: 4, carbs: 12, fat: 21 },
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },
  {
    id: 'quinoa-nutrition',
    content: 'Quinoa is a complete protein grain containing all nine essential amino acids. One cup of cooked quinoa (185g) provides 222 calories, 8g protein, 4g fat, 39g carbohydrates, and 5g fiber. It contains magnesium, phosphorus, manganese, and folate. Quinoa is gluten-free and has a low glycemic index, making it suitable for celiac disease and diabetes management. It provides sustained energy and is excellent for vegetarian protein needs.',
    metadata: {
      type: 'food_data',
      title: 'Quinoa Complete Protein Profile',
      source: 'Food Database',
      tags: ['quinoa', 'complete-protein', 'gluten-free', 'amino-acids', 'vegetarian'],
      calories: 222,
      macros: { protein: 8, carbs: 39, fat: 4 },
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },

  // Healthy recipes
  {
    id: 'protein-breakfast-bowl',
    content: 'High-Protein Breakfast Bowl: Combine 1 cup Greek yogurt (20g protein) with 1/2 cup mixed berries, 2 tablespoons chopped walnuts, 1 tablespoon chia seeds, and 1 teaspoon honey. This provides approximately 350 calories, 25g protein, 12g healthy fats, and 8g fiber. The combination offers sustained energy, probiotics for gut health, omega-3 fatty acids, and antioxidants. Perfect for muscle building, weight management, and morning energy.',
    metadata: {
      type: 'recipe',
      title: 'High-Protein Breakfast Bowl',
      source: 'Nutrition Recipes',
      tags: ['breakfast', 'high-protein', 'quick', 'healthy-fats', 'probiotics'],
      calories: 350,
      macros: { protein: 25, carbs: 30, fat: 12 },
      difficulty: 'beginner',
      goals: ['muscle_gain', 'general_health'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.85
    }
  },
  {
    id: 'balanced-power-salad',
    content: 'Balanced Power Salad: Mix 2 cups spinach and kale, 4oz grilled chicken breast, 1/3 cup cooked quinoa, 1/4 avocado, cherry tomatoes, cucumber, and olive oil vinaigrette. This nutrient-dense meal provides 450 calories, 35g protein, complete amino acids, healthy fats, fiber, iron, and vitamins A, C, and K. Excellent for weight loss, muscle maintenance, and sustained energy throughout the day.',
    metadata: {
      type: 'recipe',
      title: 'Balanced Power Salad',
      source: 'Nutrition Recipes',
      tags: ['lunch', 'salad', 'complete-nutrition', 'weight-loss', 'meal-prep'],
      calories: 450,
      macros: { protein: 35, carbs: 25, fat: 18 },
      difficulty: 'beginner',
      goals: ['weight_loss', 'muscle_gain', 'general_health'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.85
    }
  },
  {
    id: 'post-workout-smoothie',
    content: 'Post-Workout Recovery Smoothie: Blend 1 banana, 1 scoop protein powder, 1 cup spinach, 1 tablespoon almond butter, 1 cup almond milk, and ice. This recovery drink provides 300 calories, 25g protein, fast-digesting carbs, potassium for muscle function, and anti-inflammatory nutrients. The 3:1 carb-to-protein ratio is optimal for muscle recovery and glycogen replenishment within the post-workout window.',
    metadata: {
      type: 'recipe',
      title: 'Post-Workout Recovery Smoothie',
      source: 'Sports Nutrition',
      tags: ['post-workout', 'smoothie', 'recovery', 'protein', 'quick'],
      calories: 300,
      macros: { protein: 25, carbs: 35, fat: 8 },
      difficulty: 'beginner',
      goals: ['muscle_gain', 'general_health'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.9
    }
  },

  // Supplement information
  {
    id: 'basic-supplements',
    content: 'Essential supplements for most people include: Vitamin D3 (1000-4000 IU daily) especially in winter months, Vitamin B12 (2.4 mcg daily) particularly for vegetarians, Omega-3 fish oil (250-500mg EPA/DHA daily) for heart and brain health, and a quality multivitamin to fill nutritional gaps. Magnesium (200-400mg) may help with sleep and muscle function. Always consult healthcare providers before starting supplements, as whole foods are the preferred source of nutrients.',
    metadata: {
      type: 'supplement_info',
      title: 'Essential Daily Supplements',
      source: 'Supplement Research',
      tags: ['supplements', 'vitamin-d', 'b12', 'omega-3', 'multivitamin'],
      lastUpdated: new Date().toISOString(),
      credibilityScore: 0.8
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    devLog('Starting knowledge base population...');

    // Initialize the RAG system
    await localNutritionRAG.initialize();

    // Add all nutrition knowledge documents
    let successCount = 0;
    const errors: string[] = [];

    for (const document of NUTRITION_KNOWLEDGE) {
      try {
        await localNutritionRAG.addDocument(document);
        successCount++;
        devLog(`Added document: ${document.metadata.title}`);
      } catch (error) {
        const errorMsg = `Failed to add ${document.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logError('Document addition failed', error);
      }
    }

    // Get collection stats
    const stats = await localNutritionRAG.getCollectionStats();

    devLog(`Knowledge population completed: ${successCount}/${NUTRITION_KNOWLEDGE.length} documents added`);

    return NextResponse.json({
      success: true,
      message: 'Knowledge base populated successfully',
      stats: {
        documentsAdded: successCount,
        totalAttempted: NUTRITION_KNOWLEDGE.length,
        totalInCollection: stats.totalDocuments,
        errors: errors.length,
        errorDetails: errors
      },
      collectionStats: stats
    });

  } catch (error) {
    logError('Knowledge population failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to populate knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current collection stats
    const stats = await localNutritionRAG.getCollectionStats();

    return NextResponse.json({
      success: true,
      stats,
      ready: stats.totalDocuments > 0
    });

  } catch (error) {
    logError('Getting knowledge stats failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get knowledge stats'
      },
      { status: 500 }
    );
  }
}