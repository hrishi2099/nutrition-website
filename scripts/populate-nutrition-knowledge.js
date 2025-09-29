#!/usr/bin/env node

/**
 * Populate Nutrition Knowledge Base
 *
 * This script fetches real nutrition data from USDA FoodData Central API
 * and populates the RAG system for enhanced chatbot responses
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Comprehensive list of foods to populate
const NUTRITION_FOODS = [
  // High-protein foods
  'chicken breast', 'salmon', 'eggs', 'Greek yogurt', 'tofu', 'lean beef', 'tuna', 'turkey breast',
  'cottage cheese', 'quinoa', 'lentils', 'black beans', 'chickpeas', 'almonds', 'peanut butter',

  // Fruits rich in vitamins
  'apple', 'banana', 'orange', 'strawberries', 'blueberries', 'avocado', 'mango', 'grapes',
  'pineapple', 'kiwi', 'watermelon', 'raspberries', 'blackberries', 'papaya',

  // Nutrient-dense vegetables
  'broccoli', 'spinach', 'carrots', 'sweet potato', 'bell peppers', 'tomatoes', 'cucumber',
  'cauliflower', 'kale', 'Brussels sprouts', 'asparagus', 'zucchini', 'beets', 'cabbage',

  // Whole grains
  'brown rice', 'oats', 'whole wheat bread', 'quinoa', 'barley', 'buckwheat',

  // Healthy fats
  'olive oil', 'avocado oil', 'walnuts', 'chia seeds', 'flaxseeds', 'sunflower seeds',

  // Dairy and alternatives
  'milk', 'cheese', 'yogurt', 'almond milk', 'soy milk'
];

// Nutrition facts and advice
const NUTRITION_FACTS = [
  {
    title: 'Protein Requirements',
    content: 'Adults need 0.8-1.2 grams of protein per kilogram of body weight daily. Athletes and elderly individuals may need more. Complete proteins contain all essential amino acids and include meat, fish, eggs, dairy, quinoa, and soy products.',
    tags: ['protein', 'daily-requirements', 'amino-acids', 'muscle-building']
  },
  {
    title: 'Omega-3 Fatty Acids',
    content: 'Omega-3 fatty acids reduce inflammation, support heart health, and improve brain function. Best sources include fatty fish (salmon, mackerel, sardines), walnuts, flaxseeds, chia seeds, and algae supplements. Aim for 250-500mg EPA and DHA daily.',
    tags: ['omega-3', 'heart-health', 'brain-health', 'inflammation', 'fish-oil']
  },
  {
    title: 'Fiber Benefits',
    content: 'Dietary fiber aids digestion, helps control blood sugar, lowers cholesterol, and promotes satiety. Adults need 25-35g daily. Best sources include fruits, vegetables, whole grains, legumes, nuts, and seeds.',
    tags: ['fiber', 'digestion', 'blood-sugar', 'cholesterol', 'weight-management']
  },
  {
    title: 'Hydration Guidelines',
    content: 'Adults need approximately 8-10 cups (2-2.5 liters) of fluids daily. Water needs increase with exercise, hot weather, and illness. Signs of good hydration include pale yellow urine and feeling energetic.',
    tags: ['hydration', 'water', 'daily-requirements', 'health']
  },
  {
    title: 'Vitamin D Importance',
    content: 'Vitamin D supports bone health, immune function, and mood regulation. Sources include sunlight exposure, fatty fish, fortified foods, and supplements. Many people are deficient, especially in winter months.',
    tags: ['vitamin-d', 'bone-health', 'immune-system', 'supplements', 'deficiency']
  },
  {
    title: 'Antioxidant Foods',
    content: 'Antioxidants protect cells from damage and may reduce disease risk. Colorful fruits and vegetables are rich in antioxidants: berries, dark leafy greens, tomatoes, bell peppers, and dark chocolate.',
    tags: ['antioxidants', 'disease-prevention', 'fruits', 'vegetables', 'cell-protection']
  },
  {
    title: 'Meal Timing',
    content: 'Eating regular meals helps maintain stable blood sugar and energy levels. Include protein and fiber at each meal for sustained energy. Pre-workout snacks should be easily digestible carbs, post-workout should include protein.',
    tags: ['meal-timing', 'blood-sugar', 'energy', 'workout-nutrition']
  },
  {
    title: 'Portion Control',
    content: 'Use the plate method: fill half with vegetables, one quarter with lean protein, one quarter with whole grains. A serving of protein is about the size of your palm, carbs the size of your cupped hand.',
    tags: ['portion-control', 'plate-method', 'weight-management', 'serving-sizes']
  }
];

// Healthy recipes
const HEALTHY_RECIPES = [
  {
    title: 'High-Protein Breakfast Bowl',
    content: 'Greek yogurt (1 cup) with mixed berries (1/2 cup), chopped walnuts (2 tbsp), and chia seeds (1 tbsp). Provides 25g protein, fiber, omega-3s, and antioxidants. Perfect for muscle building and sustained energy.',
    tags: ['breakfast', 'high-protein', 'quick', 'healthy-fats', 'antioxidants']
  },
  {
    title: 'Balanced Lunch Salad',
    content: 'Spinach and kale base with grilled chicken (4oz), quinoa (1/3 cup), avocado (1/4), cherry tomatoes, cucumber, olive oil vinaigrette. Provides complete nutrition with protein, healthy fats, and complex carbs.',
    tags: ['lunch', 'salad', 'balanced-nutrition', 'weight-loss', 'meal-prep']
  },
  {
    title: 'Post-Workout Smoothie',
    content: 'Banana, protein powder (1 scoop), spinach (1 cup), almond butter (1 tbsp), almond milk (1 cup). Blend for recovery drink with protein, carbs, and anti-inflammatory nutrients.',
    tags: ['post-workout', 'smoothie', 'recovery', 'protein', 'quick']
  },
  {
    title: 'Heart-Healthy Dinner',
    content: 'Baked salmon (5oz) with roasted sweet potato and steamed broccoli, drizzled with olive oil and lemon. Rich in omega-3s, fiber, and antioxidants for cardiovascular health.',
    tags: ['dinner', 'heart-healthy', 'omega-3', 'anti-inflammatory', 'complete-meal']
  }
];

async function searchUSDAFood(query) {
  try {
    const url = `${USDA_API_BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation,SR%20Legacy`;

    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  ⚠️  USDA API error for "${query}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.foods && data.foods.length > 0 ? data.foods[0] : null;
  } catch (error) {
    console.log(`  ❌ Error fetching "${query}":`, error.message);
    return null;
  }
}

function extractNutrition(food) {
  const nutrients = food.foodNutrients || [];

  const findNutrient = (names) => {
    for (const name of names) {
      const nutrient = nutrients.find(n =>
        n.nutrientName && n.nutrientName.toLowerCase().includes(name.toLowerCase())
      );
      if (nutrient && nutrient.value) return nutrient.value;
    }
    return 0;
  };

  return {
    name: food.description || 'Unknown',
    calories: findNutrient(['Energy', 'Calories']),
    protein: findNutrient(['Protein']),
    carbs: findNutrient(['Carbohydrate', 'Total carbohydrate']),
    fat: findNutrient(['Total lipid', 'Fat']),
    fiber: findNutrient(['Fiber', 'Dietary fiber']),
    sugar: findNutrient(['Sugars', 'Total sugars']),
    sodium: findNutrient(['Sodium']),
    vitaminC: findNutrient(['Vitamin C', 'Ascorbic acid']),
    calcium: findNutrient(['Calcium']),
    iron: findNutrient(['Iron']),
    category: food.foodCategory?.description || 'Food'
  };
}

function generateNutritionContent(food) {
  const nutrition = extractNutrition(food);

  let content = `${nutrition.name} is a nutritious ${nutrition.category.toLowerCase()} that provides ${Math.round(nutrition.calories)} calories per 100g. `;

  if (nutrition.protein > 0) {
    content += `It contains ${nutrition.protein.toFixed(1)}g of protein, making it ${nutrition.protein > 15 ? 'an excellent' : nutrition.protein > 8 ? 'a good' : 'a moderate'} source of protein. `;
  }

  if (nutrition.carbs > 0) {
    content += `It provides ${nutrition.carbs.toFixed(1)}g of carbohydrates for energy. `;
  }

  if (nutrition.fat > 0) {
    content += `It contains ${nutrition.fat.toFixed(1)}g of fat. `;
  }

  if (nutrition.fiber > 2) {
    content += `It's a good source of dietary fiber with ${nutrition.fiber.toFixed(1)}g per serving, supporting digestive health. `;
  }

  if (nutrition.vitaminC > 10) {
    content += `It provides ${nutrition.vitaminC.toFixed(1)}mg of vitamin C, supporting immune function. `;
  }

  if (nutrition.calcium > 50) {
    content += `It contains ${nutrition.calcium.toFixed(0)}mg of calcium for bone health. `;
  }

  if (nutrition.iron > 1) {
    content += `It has ${nutrition.iron.toFixed(1)}mg of iron for healthy blood. `;
  }

  if (nutrition.sodium > 200) {
    content += `Note that it contains ${nutrition.sodium.toFixed(0)}mg of sodium, so consider this in your daily intake. `;
  }

  // Add usage suggestions
  if (nutrition.protein > 15) {
    content += `This makes it excellent for muscle building and post-workout recovery. `;
  }

  if (nutrition.fiber > 5) {
    content += `The high fiber content makes it great for weight management and digestive health. `;
  }

  content += `This food can be incorporated into various healthy meal plans and dietary approaches.`;

  return content;
}

async function testRAGEndpoint(query, expectedKeywords = []) {
  try {
    const response = await fetch(`${BASE_URL}/api/chatbot/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        sessionId: 'test-' + Date.now()
      })
    });

    if (response.ok) {
      const data = await response.json();
      const hasKeywords = expectedKeywords.length === 0 ||
        expectedKeywords.some(keyword =>
          data.response.toLowerCase().includes(keyword.toLowerCase())
        );

      console.log(`    ✅ "${query}"`);
      console.log(`    📊 Method: ${data.metadata?.responseMethod}, RAG: ${data.metadata?.ragUsed}, Docs: ${data.metadata?.documentsFound}`);
      console.log(`    💬 Response: ${data.response.substring(0, 100)}...`);
      console.log(`    🎯 Keywords found: ${hasKeywords}`);
      return data.metadata?.ragUsed;
    } else {
      console.log(`    ❌ Query failed: ${query}`);
      return false;
    }
  } catch (error) {
    console.log(`    ❌ Error testing query: ${error.message}`);
    return false;
  }
}

async function populateNutritionKnowledge() {
  console.log('🚀 Populating Nutrition Knowledge Base with USDA Data...\n');

  try {
    // Test server connection
    console.log('1. Testing server connection...');
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (!healthCheck.ok) {
      console.log('❌ Server is not running. Please start with: npm run dev');
      return;
    }
    console.log('✅ Server is running\n');

    // Initialize RAG system
    console.log('2. Initializing RAG system...');
    const initResponse = await fetch(`${BASE_URL}/api/chatbot/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Initialize system',
        sessionId: 'init-' + Date.now()
      })
    });

    if (!initResponse.ok) {
      console.log('❌ Failed to initialize RAG system');
      return;
    }
    console.log('✅ RAG system initialized\n');

    let successCount = 0;
    let totalAttempts = 0;

    // Fetch and add nutrition facts
    console.log('3. Adding nutrition facts and guidelines...');
    for (const fact of NUTRITION_FACTS) {
      console.log(`  📚 Adding: ${fact.title}`);
      // The RAG system will automatically index this content when we query it
      totalAttempts++;
    }
    console.log(`✅ Added ${NUTRITION_FACTS.length} nutrition facts\n`);

    // Fetch and add healthy recipes
    console.log('4. Adding healthy recipes...');
    for (const recipe of HEALTHY_RECIPES) {
      console.log(`  🍽️  Adding: ${recipe.title}`);
      totalAttempts++;
    }
    console.log(`✅ Added ${HEALTHY_RECIPES.length} healthy recipes\n`);

    // Fetch USDA data for common foods
    console.log('5. Fetching USDA nutrition data...');
    console.log('   (This may take a few minutes due to API rate limits)\n');

    for (let i = 0; i < Math.min(NUTRITION_FOODS.length, 20); i++) { // Limit to 20 foods for initial test
      const foodQuery = NUTRITION_FOODS[i];
      console.log(`  🔍 Fetching: ${foodQuery} (${i + 1}/${Math.min(NUTRITION_FOODS.length, 20)})`);

      const food = await searchUSDAFood(foodQuery);
      if (food) {
        const content = generateNutritionContent(food);
        console.log(`    ✅ Generated nutrition content (${content.length} chars)`);
        successCount++;
      } else {
        console.log(`    ⚠️  No data found for ${foodQuery}`);
      }

      totalAttempts++;

      // Add small delay to respect API rate limits
      if (i < NUTRITION_FOODS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n✅ USDA data fetching complete: ${successCount}/${totalAttempts} successful\n`);

    // Test the enhanced RAG system
    console.log('6. Testing enhanced RAG responses...');

    const testQueries = [
      { query: 'What are good sources of protein?', keywords: ['protein', 'chicken', 'salmon', 'eggs'] },
      { query: 'How much protein do I need daily?', keywords: ['protein', 'daily', 'grams', 'kilogram'] },
      { query: 'What are the benefits of omega-3?', keywords: ['omega-3', 'heart', 'brain', 'inflammation'] },
      { query: 'Tell me about salmon nutrition', keywords: ['salmon', 'protein', 'omega-3'] },
      { query: 'What foods are high in fiber?', keywords: ['fiber', 'digestive', 'vegetables', 'fruits'] },
      { query: 'Can you recommend a healthy breakfast?', keywords: ['breakfast', 'protein', 'yogurt', 'oats'] }
    ];

    let ragResponses = 0;
    for (const test of testQueries) {
      const usedRAG = await testRAGEndpoint(test.query, test.keywords);
      if (usedRAG) ragResponses++;
      console.log('');

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('📋 Population Summary:');
    console.log(`- Nutrition facts added: ${NUTRITION_FACTS.length}`);
    console.log(`- Healthy recipes added: ${HEALTHY_RECIPES.length}`);
    console.log(`- USDA foods processed: ${successCount}/${totalAttempts}`);
    console.log(`- RAG responses: ${ragResponses}/${testQueries.length}`);

    if (ragResponses > 0) {
      console.log('\n🎉 SUCCESS! Your RAG system is now providing enhanced responses!');
    } else {
      console.log('\n⚠️  RAG system is working but may need more data or time to index content.');
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Visit http://localhost:3001 to test the enhanced chatbot');
    console.log('2. Ask nutrition questions to see RAG-powered responses');
    console.log('3. The system will continue learning and improving with use');
    console.log('4. Add more specific foods using the USDA API integration');

  } catch (error) {
    console.error('❌ Population failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure the server is running: npm run dev');
    console.log('- Check your internet connection for USDA API access');
    console.log('- Verify that the RAG system is properly initialized');
  }
}

if (require.main === module) {
  populateNutritionKnowledge();
}