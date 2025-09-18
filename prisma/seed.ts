import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const hashedPassword = await hashPassword('password123');
  
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      age: 30,
      height: 175,
      weight: 75,
      gender: 'MALE',
      activityLevel: 'MODERATELY_ACTIVE',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: hashedPassword,
      age: 28,
      height: 165,
      weight: 65,
      gender: 'FEMALE',
      activityLevel: 'LIGHTLY_ACTIVE',
    },
  });

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nutrisap.com' },
    update: {},
    create: {
      email: 'admin@nutrisap.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      age: 35,
      height: 170,
      weight: 70,
      gender: 'MALE',
      activityLevel: 'MODERATELY_ACTIVE',
    },
  });

  // Create sample diet plans
  const weightLossPlan = await prisma.dietPlan.create({
    data: {
      name: 'Weight Loss Plan',
      description: 'Designed to help you lose weight safely and sustainably',
      type: 'WEIGHT_LOSS',
      duration: 12,
      calories: 1400,
      mealsPerDay: 5,
      price: 99.0,
      meals: {
        create: [
          {
            name: 'Protein-Packed Overnight Oats',
            type: 'BREAKFAST',
            calories: 350,
            protein: 25,
            carbs: 45,
            fat: 8,
            instructions: 'Mix oats with Greek yogurt, add berries and chia seeds. Refrigerate overnight.',
            ingredients: {
              create: [
                { name: 'Rolled oats', quantity: '50', unit: 'g' },
                { name: 'Greek yogurt', quantity: '150', unit: 'g' },
                { name: 'Mixed berries', quantity: '80', unit: 'g' },
                { name: 'Chia seeds', quantity: '15', unit: 'g' },
                { name: 'Almond butter', quantity: '15', unit: 'g' },
              ],
            },
          },
          {
            name: 'Grilled Chicken Salad',
            type: 'LUNCH',
            calories: 420,
            protein: 35,
            carbs: 15,
            fat: 25,
            instructions: 'Grill chicken breast, serve over mixed greens with vegetables and olive oil dressing.',
            ingredients: {
              create: [
                { name: 'Chicken breast', quantity: '150', unit: 'g' },
                { name: 'Mixed greens', quantity: '100', unit: 'g' },
                { name: 'Cherry tomatoes', quantity: '100', unit: 'g' },
                { name: 'Cucumber', quantity: '80', unit: 'g' },
                { name: 'Olive oil', quantity: '20', unit: 'ml' },
                { name: 'Lemon juice', quantity: '15', unit: 'ml' },
              ],
            },
          },
          {
            name: 'Baked Salmon with Vegetables',
            type: 'DINNER',
            calories: 480,
            protein: 40,
            carbs: 20,
            fat: 28,
            instructions: 'Bake salmon fillet with seasonal vegetables drizzled with herbs and olive oil.',
            ingredients: {
              create: [
                { name: 'Salmon fillet', quantity: '150', unit: 'g' },
                { name: 'Broccoli', quantity: '150', unit: 'g' },
                { name: 'Sweet potato', quantity: '100', unit: 'g' },
                { name: 'Asparagus', quantity: '100', unit: 'g' },
                { name: 'Olive oil', quantity: '15', unit: 'ml' },
                { name: 'Fresh herbs', quantity: '5', unit: 'g' },
              ],
            },
          },
        ],
      },
    },
  });

  const muscleGainPlan = await prisma.dietPlan.create({
    data: {
      name: 'Muscle Gain Plan',
      description: 'Optimize your nutrition for muscle building and strength',
      type: 'MUSCLE_GAIN',
      duration: 16,
      calories: 2500,
      mealsPerDay: 7,
      price: 119.0,
      meals: {
        create: [
          {
            name: 'High-Protein Pancakes',
            type: 'BREAKFAST',
            calories: 520,
            protein: 35,
            carbs: 45,
            fat: 20,
            instructions: 'Blend protein powder with oats and eggs, cook as pancakes and top with Greek yogurt.',
            ingredients: {
              create: [
                { name: 'Protein powder', quantity: '30', unit: 'g' },
                { name: 'Rolled oats', quantity: '60', unit: 'g' },
                { name: 'Eggs', quantity: '2', unit: 'whole' },
                { name: 'Greek yogurt', quantity: '100', unit: 'g' },
                { name: 'Banana', quantity: '1', unit: 'medium' },
                { name: 'Honey', quantity: '15', unit: 'ml' },
              ],
            },
          },
          {
            name: 'Post-Workout Protein Bowl',
            type: 'SNACK',
            calories: 380,
            protein: 30,
            carbs: 35,
            fat: 12,
            instructions: 'Combine quinoa with protein powder, add nuts and fruits for a recovery meal.',
            ingredients: {
              create: [
                { name: 'Cooked quinoa', quantity: '80', unit: 'g' },
                { name: 'Protein powder', quantity: '25', unit: 'g' },
                { name: 'Almonds', quantity: '20', unit: 'g' },
                { name: 'Blueberries', quantity: '80', unit: 'g' },
                { name: 'Coconut milk', quantity: '100', unit: 'ml' },
              ],
            },
          },
        ],
      },
    },
  });

  // Create sample goals
  await prisma.goal.create({
    data: {
      type: 'WEIGHT_LOSS',
      target: 70.0,
      userId: user1.id,
    },
  });

  await prisma.goal.create({
    data: {
      type: 'MUSCLE_GAIN',
      target: 5.0,
      userId: user2.id,
    },
  });

  // Create sample blog categories
  const nutritionCategory = await prisma.blogCategory.upsert({
    where: { name: 'Nutrition' },
    update: {},
    create: {
      name: 'Nutrition',
      slug: 'nutrition',
      description: 'Expert advice on nutrition and healthy eating habits',
    },
  });

  const fitnessCategory = await prisma.blogCategory.upsert({
    where: { name: 'Fitness' },
    update: {},
    create: {
      name: 'Fitness',
      slug: 'fitness',
      description: 'Workout tips and fitness guidance',
    },
  });

  const recipesCategory = await prisma.blogCategory.upsert({
    where: { name: 'Recipes' },
    update: {},
    create: {
      name: 'Recipes',
      slug: 'recipes',
      description: 'Healthy and delicious recipe ideas',
    },
  });

  // Create sample blog tags
  const healthyTag = await prisma.blogTag.upsert({
    where: { name: 'Healthy Eating' },
    update: {},
    create: {
      name: 'Healthy Eating',
      slug: 'healthy-eating',
    },
  });

  const weightLossTag = await prisma.blogTag.upsert({
    where: { name: 'Weight Loss' },
    update: {},
    create: {
      name: 'Weight Loss',
      slug: 'weight-loss',
    },
  });

  const proteinTag = await prisma.blogTag.upsert({
    where: { name: 'Protein' },
    update: {},
    create: {
      name: 'Protein',
      slug: 'protein',
    },
  });

  // Create sample blog posts
  const post1 = await prisma.blogPost.upsert({
    where: { slug: '10-essential-nutrition-tips-for-better-health' },
    update: {},
    create: {
      title: '10 Essential Nutrition Tips for Better Health',
      slug: '10-essential-nutrition-tips-for-better-health',
      content: `
        <h2>Introduction</h2>
        <p>Good nutrition is the foundation of a healthy lifestyle. Whether you're looking to lose weight, gain muscle, or simply feel better, these 10 essential nutrition tips will help guide you on your journey to better health.</p>
        
        <h3>1. Eat a Rainbow of Colors</h3>
        <p>Different colored fruits and vegetables provide different nutrients. Aim to include a variety of colors in your diet to ensure you're getting a wide range of vitamins, minerals, and antioxidants.</p>
        
        <h3>2. Stay Hydrated</h3>
        <p>Water is essential for every function in your body. Aim for at least 8 glasses of water per day, more if you're active or live in a hot climate.</p>
        
        <h3>3. Include Lean Protein</h3>
        <p>Protein is crucial for muscle building and repair. Include sources like chicken, fish, beans, and Greek yogurt in your meals.</p>
        
        <h3>4. Choose Whole Grains</h3>
        <p>Whole grains provide fiber and nutrients that refined grains lack. Opt for brown rice, quinoa, and whole wheat products.</p>
        
        <h3>5. Don't Skip Meals</h3>
        <p>Regular meals help maintain steady blood sugar levels and prevent overeating later in the day.</p>
      `,
      excerpt: 'Discover the top 10 nutrition tips that can transform your health and help you achieve your wellness goals.',
      published: true,
      publishedAt: new Date(),
      authorId: user1.id,
      categoryId: nutritionCategory.id,
      tags: {
        create: [
          { tagId: healthyTag.id },
        ],
      },
    },
  });

  const post2 = await prisma.blogPost.upsert({
    where: { slug: 'ultimate-guide-meal-prep-weight-loss' },
    update: {},
    create: {
      title: 'The Ultimate Guide to Meal Prep for Weight Loss',
      slug: 'ultimate-guide-meal-prep-weight-loss',
      content: `
        <h2>Why Meal Prep Works for Weight Loss</h2>
        <p>Meal preparation is one of the most effective strategies for weight loss success. When you plan and prepare your meals in advance, you take control of your nutrition and remove the guesswork from healthy eating.</p>
        
        <h3>Benefits of Meal Prep</h3>
        <ul>
          <li>Portion control becomes automatic</li>
          <li>You save time during busy weekdays</li>
          <li>It's more cost-effective than eating out</li>
          <li>You avoid impulsive food choices</li>
          <li>You can track calories more accurately</li>
        </ul>
        
        <h3>Getting Started</h3>
        <p>Start with prepping just 2-3 meals for the week. As you get comfortable with the process, you can gradually increase to full weekly meal prep.</p>
        
        <h3>Essential Containers</h3>
        <p>Invest in good quality glass or BPA-free plastic containers with compartments. This helps with portion control and keeps foods from mixing.</p>
      `,
      excerpt: 'Learn how meal preparation can be your secret weapon for successful weight loss and healthier eating habits.',
      published: true,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      authorId: user2.id,
      categoryId: nutritionCategory.id,
      tags: {
        create: [
          { tagId: weightLossTag.id },
          { tagId: healthyTag.id },
        ],
      },
    },
  });

  const post3 = await prisma.blogPost.upsert({
    where: { slug: 'protein-packed-breakfast-recipes' },
    update: {},
    create: {
      title: 'Protein-Packed Breakfast Recipes to Start Your Day Right',
      slug: 'protein-packed-breakfast-recipes',
      content: `
        <h2>Why Protein at Breakfast Matters</h2>
        <p>Starting your day with a protein-rich breakfast helps stabilize blood sugar, increases satiety, and can boost metabolism throughout the day.</p>
        
        <h3>Recipe 1: Greek Yogurt Parfait</h3>
        <p><strong>Ingredients:</strong></p>
        <ul>
          <li>1 cup Greek yogurt</li>
          <li>1/4 cup granola</li>
          <li>1/2 cup mixed berries</li>
          <li>1 tbsp honey</li>
          <li>1 tbsp chopped nuts</li>
        </ul>
        <p><strong>Instructions:</strong> Layer ingredients in a glass, starting with yogurt, then berries, granola, and repeat. Top with nuts and honey.</p>
        
        <h3>Recipe 2: Protein Smoothie Bowl</h3>
        <p><strong>Ingredients:</strong></p>
        <ul>
          <li>1 scoop protein powder</li>
          <li>1 frozen banana</li>
          <li>1/2 cup spinach</li>
          <li>1/2 cup almond milk</li>
          <li>Toppings: granola, coconut flakes, berries</li>
        </ul>
        <p><strong>Instructions:</strong> Blend all ingredients until smooth. Pour into bowl and add toppings.</p>
      `,
      excerpt: 'Start your morning right with these delicious, protein-rich breakfast recipes that will keep you energized all day.',
      published: true,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      authorId: user1.id,
      categoryId: recipesCategory.id,
      tags: {
        create: [
          { tagId: proteinTag.id },
          { tagId: healthyTag.id },
        ],
      },
    },
  });

  // Create sample products
  const product1 = await prisma.product.create({
    data: {
      name: 'Premium Whey Protein',
      description: 'High-quality whey protein isolate for muscle building and recovery',
      price: 5999, // ₹59.99 in paisa
      imageUrl: '/api/placeholder/400/400',
      stock: 50,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Multivitamin Complex',
      description: 'Complete daily multivitamin with essential vitamins and minerals',
      price: 2999, // ₹29.99 in paisa
      imageUrl: '/api/placeholder/400/400',
      stock: 75,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Omega-3 Fish Oil',
      description: 'Pure omega-3 fatty acids for heart and brain health',
      price: 3499, // ₹34.99 in paisa
      imageUrl: '/api/placeholder/400/400',
      stock: 30,
    },
  });

  // Create default contact info
  const contactInfo = await prisma.contactInfo.create({
    data: {
      companyName: 'NutriSap',
      email: 'info@nutrisap.com',
      supportEmail: 'support@nutrisap.com',
      phone: '+1 (555) 123-4567',
      phoneHours: 'Mon-Fri: 8AM-6PM EST',
      address: '123 Wellness Street',
      city: 'Health City',
      state: 'HC',
      zipCode: '12345',
      mondayFridayHours: '8:00 AM - 6:00 PM',
      saturdayHours: '9:00 AM - 4:00 PM',
      sundayHours: 'Closed',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created users: ${user1.email}, ${user2.email}`);
  console.log(`Created admin user: ${adminUser.email} (password: password123)`);
  console.log(`Created diet plans: ${weightLossPlan.name}, ${muscleGainPlan.name}`);
  console.log(`Created blog posts: ${post1.title}, ${post2.title}, ${post3.title}`);
  console.log(`Created products: ${product1.name}, ${product2.name}, ${product3.name}`);
  console.log(`Created contact info for: ${contactInfo.companyName}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });