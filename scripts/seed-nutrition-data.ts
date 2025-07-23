import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNutritionData() {
  console.log('🌱 Seeding nutrition knowledge base...');

  // Seed nutrition facts
  const nutritionFacts = [
    {
      category: 'weight_loss',
      title: 'Calorie Deficit for Weight Loss',
      content: 'To lose 1 pound per week, create a deficit of 3,500 calories weekly (500 calories daily). This can be achieved through diet, exercise, or a combination of both.',
      tags: ['weight_loss', 'calories', 'deficit', 'fat_loss'],
      difficulty: 'beginner'
    },
    {
      category: 'muscle_gain',
      title: 'Protein Requirements for Muscle Building',
      content: 'Aim for 1.6-2.2g of protein per kg of body weight daily for optimal muscle protein synthesis. Distribute protein intake across 3-4 meals throughout the day.',
      tags: ['muscle_gain', 'protein', 'building', 'strength'],
      difficulty: 'intermediate'
    },
    {
      category: 'general',
      title: 'Hydration Guidelines',
      content: 'Drink at least 8-10 glasses of water daily. Increase intake during exercise, hot weather, or illness. Monitor urine color - pale yellow indicates good hydration.',
      tags: ['hydration', 'water', 'health', 'general'],
      difficulty: 'beginner'
    },
    {
      category: 'supplements',
      title: 'Vitamin D Benefits',
      content: 'Vitamin D supports bone health, immune function, and muscle strength. Most adults need 1000-2000 IU daily. Consider testing blood levels to determine optimal dosage.',
      tags: ['vitamin_d', 'supplements', 'immunity', 'bones'],
      difficulty: 'intermediate'
    },
    {
      category: 'general',
      title: 'Meal Timing for Metabolism',
      content: 'Eating regular meals every 3-4 hours helps maintain stable blood sugar and metabolism. Include protein and fiber at each meal to promote satiety.',
      tags: ['meal_timing', 'metabolism', 'blood_sugar', 'satiety'],
      difficulty: 'beginner'
    }
  ];

  // Seed food database
  const foods = [
    {
      name: 'Chicken Breast',
      category: 'proteins',
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
      fiberPer100g: 0,
      commonServing: '1 piece (100g)',
      tags: ['high_protein', 'lean', 'low_carb', 'muscle_building']
    },
    {
      name: 'Broccoli',
      category: 'vegetables',
      caloriesPer100g: 34,
      proteinPer100g: 2.8,
      carbsPer100g: 7,
      fatPer100g: 0.4,
      fiberPer100g: 2.6,
      vitaminC: 89.2,
      commonServing: '1 cup chopped (91g)',
      tags: ['low_calorie', 'high_fiber', 'vegetarian', 'vitamin_c']
    },
    {
      name: 'Sweet Potato',
      category: 'vegetables',
      caloriesPer100g: 86,
      proteinPer100g: 1.6,
      carbsPer100g: 20,
      fatPer100g: 0.1,
      fiberPer100g: 3,
      commonServing: '1 medium (128g)',
      tags: ['complex_carbs', 'high_fiber', 'vitamin_a', 'vegetarian']
    },
    {
      name: 'Salmon',
      category: 'proteins',
      caloriesPer100g: 208,
      proteinPer100g: 22,
      carbsPer100g: 0,
      fatPer100g: 13,
      fiberPer100g: 0,
      commonServing: '1 fillet (150g)',
      tags: ['high_protein', 'omega_3', 'heart_healthy', 'anti_inflammatory']
    },
    {
      name: 'Quinoa',
      category: 'grains',
      caloriesPer100g: 368,
      proteinPer100g: 14,
      carbsPer100g: 64,
      fatPer100g: 6,
      fiberPer100g: 7,
      commonServing: '1 cup cooked (185g)',
      tags: ['complete_protein', 'gluten_free', 'high_fiber', 'vegetarian']
    },
    {
      name: 'Greek Yogurt',
      category: 'dairy',
      caloriesPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 3.6,
      fatPer100g: 0.4,
      fiberPer100g: 0,
      calcium: 110,
      commonServing: '1 cup (170g)',
      tags: ['high_protein', 'probiotics', 'low_fat', 'calcium']
    }
  ];

  // Seed recipe recommendations
  const recipes = [
    {
      name: 'High-Protein Breakfast Bowl',
      category: 'breakfast',
      difficulty: 'easy',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      calories: 350,
      protein: 25,
      carbs: 30,
      fat: 12,
      ingredients: ['1 cup Greek yogurt', '1/2 cup berries', '1 tbsp almond butter', '1 tbsp chia seeds', '1 tsp honey'],
      instructions: 'Mix Greek yogurt with chia seeds. Top with berries, almond butter, and honey. Perfect for muscle building and weight management.',
      dietaryTags: ['vegetarian', 'gluten_free', 'high_protein'],
      goalTags: ['muscle_gain', 'weight_loss', 'breakfast']
    },
    {
      name: 'Grilled Chicken & Veggie Bowl',
      category: 'lunch',
      difficulty: 'medium',
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      calories: 420,
      protein: 35,
      carbs: 25,
      fat: 18,
      ingredients: ['200g chicken breast', '1 cup broccoli', '1 cup sweet potato cubes', '2 tbsp olive oil', 'herbs and spices'],
      instructions: 'Season and grill chicken breast. Roast sweet potato and broccoli with olive oil. Combine in bowl with fresh herbs.',
      dietaryTags: ['gluten_free', 'dairy_free', 'high_protein'],
      goalTags: ['muscle_gain', 'weight_loss', 'balanced']
    },
    {
      name: 'Quinoa Power Salad',
      category: 'lunch',
      difficulty: 'easy',
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      calories: 380,
      protein: 15,
      carbs: 45,
      fat: 14,
      ingredients: ['1 cup quinoa', '2 cups mixed greens', '1/2 avocado', '1/4 cup nuts', 'lemon vinaigrette'],
      instructions: 'Cook quinoa according to package directions. Mix with greens, avocado, and nuts. Dress with lemon vinaigrette.',
      dietaryTags: ['vegetarian', 'vegan', 'gluten_free', 'high_fiber'],
      goalTags: ['weight_loss', 'heart_healthy', 'plant_based']
    }
  ];

  try {
    // Clear existing data
    await prisma.nutritionFact.deleteMany();
    await prisma.foodDatabase.deleteMany();
    await prisma.recipeRecommendation.deleteMany();

    // Insert nutrition facts
    for (const fact of nutritionFacts) {
      await prisma.nutritionFact.create({ data: fact });
    }
    console.log(`✅ Created ${nutritionFacts.length} nutrition facts`);

    // Insert foods
    for (const food of foods) {
      await prisma.foodDatabase.create({ data: food });
    }
    console.log(`✅ Created ${foods.length} food entries`);

    // Insert recipes
    for (const recipe of recipes) {
      await prisma.recipeRecommendation.create({ data: recipe });
    }
    console.log(`✅ Created ${recipes.length} recipe recommendations`);

    console.log('🎉 Nutrition knowledge base seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding nutrition data:', error);
  }
}

seedNutritionData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });