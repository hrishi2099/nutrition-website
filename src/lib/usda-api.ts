// USDA FoodData Central API Integration
// Free API - No key required, 3600 requests/hour limit

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: USDANutrient[];
  foodCategory?: {
    description: string;
  };
  servingSizeUnit?: string;
  servingSize?: number;
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export class USDAFoodDataAPI {
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  async searchFoods(query: string, pageSize: number = 25): Promise<USDASearchResult> {
    try {
      const url = `${this.baseUrl}/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching USDA foods:', error);
      throw error;
    }
  }

  async getFoodDetails(fdcId: number): Promise<USDAFood> {
    try {
      const url = `${this.baseUrl}/food/${fdcId}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting USDA food details:', error);
      throw error;
    }
  }

  // Extract key nutrients for our nutrition database
  extractNutrition(food: USDAFood): {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    vitaminC: number;
    calcium: number;
    iron: number;
    category: string;
  } {
    const nutrients = food.foodNutrients;

    const findNutrient = (names: string[]): number => {
      for (const name of names) {
        const nutrient = nutrients.find(n =>
          n.nutrientName.toLowerCase().includes(name.toLowerCase()) ||
          n.nutrientNumber === this.getNutrientNumber(name)
        );
        if (nutrient) return nutrient.value || 0;
      }
      return 0;
    };

    return {
      name: food.description,
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
      category: food.foodCategory?.description || 'Unknown'
    };
  }

  private getNutrientNumber(name: string): string {
    const nutrientNumbers: { [key: string]: string } = {
      'energy': '208',
      'protein': '203',
      'carbohydrate': '205',
      'fat': '204',
      'fiber': '291',
      'sugar': '269',
      'sodium': '307',
      'vitamin c': '401',
      'calcium': '301',
      'iron': '303'
    };
    return nutrientNumbers[name.toLowerCase()] || '';
  }

  // Generate nutrition content for RAG system
  generateNutritionContent(food: USDAFood): string {
    const nutrition = this.extractNutrition(food);

    return `${nutrition.name} is a ${nutrition.category.toLowerCase()} that provides ${nutrition.calories} calories per 100g. ` +
           `It contains ${nutrition.protein}g protein, ${nutrition.carbs}g carbohydrates, and ${nutrition.fat}g fat. ` +
           `${nutrition.fiber > 0 ? `It's a good source of fiber with ${nutrition.fiber}g per serving. ` : ''}` +
           `${nutrition.vitaminC > 0 ? `It provides ${nutrition.vitaminC}mg of vitamin C. ` : ''}` +
           `${nutrition.calcium > 0 ? `It contains ${nutrition.calcium}mg of calcium. ` : ''}` +
           `${nutrition.iron > 0 ? `It has ${nutrition.iron}mg of iron. ` : ''}` +
           `${nutrition.sodium > 10 ? `Note that it contains ${nutrition.sodium}mg of sodium. ` : ''}` +
           `This makes it suitable for various dietary needs and meal planning.`;
  }

  // Get popular foods to populate knowledge base
  async getPopularFoods(): Promise<string[]> {
    return [
      // Proteins
      'chicken breast', 'salmon', 'eggs', 'Greek yogurt', 'tofu', 'lean beef', 'tuna', 'turkey',
      'cottage cheese', 'quinoa', 'lentils', 'black beans', 'almonds', 'peanut butter',

      // Fruits
      'apple', 'banana', 'orange', 'strawberries', 'blueberries', 'avocado', 'mango', 'grapes',
      'pineapple', 'kiwi', 'watermelon', 'raspberries',

      // Vegetables
      'broccoli', 'spinach', 'carrots', 'sweet potato', 'bell peppers', 'tomatoes', 'cucumber',
      'cauliflower', 'kale', 'Brussels sprouts', 'asparagus', 'zucchini',

      // Grains
      'brown rice', 'oats', 'whole wheat bread', 'pasta', 'barley', 'buckwheat',

      // Dairy
      'milk', 'cheese', 'butter', 'yogurt',

      // Nuts & Seeds
      'walnuts', 'chia seeds', 'flaxseeds', 'sunflower seeds', 'pumpkin seeds',

      // Others
      'olive oil', 'honey', 'dark chocolate', 'green tea'
    ];
  }
}

export const usdaAPI = new USDAFoodDataAPI();