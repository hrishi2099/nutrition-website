const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPdfProducts() {
  try {
    console.log('🌱 Seeding PDF products...');

    // Create PDF products
    const pdfProducts = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Complete Nutrition Guide for Athletes',
          description: 'Comprehensive 50-page PDF guide covering sports nutrition, meal planning, and performance optimization for athletes of all levels.',
          price: 1999, // $19.99 in cents
          productType: 'pdf',
          stock: 999,
          pdfFilePath: '/pdfs/nutrition-guide-athletes.pdf',
          pdfFileName: 'Complete_Nutrition_Guide_Athletes.pdf',
          pdfFileSize: 8500000, // 8.5MB
          pdfPageCount: 50,
          pdfDownloadLimit: 5,
          pdfExpiryDays: 365,
          pdfAuthor: 'Dr. Sarah Johnson, Sports Nutritionist',
          pdfLanguage: 'English',
        },
      }),

      prisma.product.create({
        data: {
          name: 'Weight Loss Meal Plan & Recipe Book',
          description: 'A comprehensive 75-page PDF containing scientifically-backed meal plans, 100+ healthy recipes, and weight loss strategies.',
          price: 1499, // $14.99 in cents
          productType: 'pdf',
          stock: 999,
          pdfFilePath: '/pdfs/weight-loss-meal-plan.pdf',
          pdfFileName: 'Weight_Loss_Meal_Plan_Recipe_Book.pdf',
          pdfFileSize: 12000000, // 12MB
          pdfPageCount: 75,
          pdfDownloadLimit: 3,
          pdfExpiryDays: 180,
          pdfAuthor: 'NutriSap Nutrition Team',
          pdfLanguage: 'English',
        },
      }),

      prisma.product.create({
        data: {
          name: 'Supplement Stacking Guide',
          description: 'Expert guide on how to safely and effectively combine supplements for maximum benefit. Includes timing, dosages, and interactions.',
          price: 999, // $9.99 in cents
          productType: 'pdf',
          stock: 999,
          pdfFilePath: '/pdfs/supplement-stacking-guide.pdf',
          pdfFileName: 'Supplement_Stacking_Guide.pdf',
          pdfFileSize: 5500000, // 5.5MB
          pdfPageCount: 32,
          pdfDownloadLimit: 10,
          pdfExpiryDays: 730,
          pdfAuthor: 'Dr. Mike Chen, Nutritionist',
          pdfLanguage: 'English',
        },
      }),
    ]);

    console.log('✅ Successfully created PDF products:');
    pdfProducts.forEach((product) => {
      console.log(`  - ${product.name} (${product.id})`);
    });

    console.log('\n🎉 PDF product seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding PDF products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedPdfProducts()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedPdfProducts };