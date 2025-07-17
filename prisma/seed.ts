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

  console.log('✅ Database seeded successfully!');
  console.log(`Created users: ${user1.email}, ${user2.email}`);
  console.log(`Created diet plans: ${weightLossPlan.name}, ${muscleGainPlan.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });