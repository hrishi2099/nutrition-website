const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTeamMembers() {
  try {
    console.log('🌱 Seeding team members...');

    // Check if team members already exist
    const existingCount = await prisma.teamMember.count();
    if (existingCount > 0) {
      console.log(`✅ Team members already exist (${existingCount} found). Skipping seed.`);
      return;
    }

    const teamMembers = [
      {
        name: 'Dr. Sarah Johnson',
        position: 'Lead Nutritionist',
        bio: 'Ph.D. in Nutritional Science with 10+ years of experience in clinical nutrition and wellness coaching.',
        avatar: '👩‍⚕️',
        email: 'sarah.johnson@nutrisap.com',
        specialties: ['Clinical Nutrition', 'Wellness Coaching', 'Nutritional Science'],
        displayOrder: 0,
        isActive: true
      },
      {
        name: 'Michael Chen',
        position: 'Sports Nutritionist',
        bio: 'Registered Dietitian specializing in athletic performance and sports nutrition for optimal results.',
        avatar: '👨‍⚕️',
        email: 'michael.chen@nutrisap.com',
        specialties: ['Sports Nutrition', 'Athletic Performance', 'Diet Planning'],
        displayOrder: 1,
        isActive: true
      },
      {
        name: 'Emily Rodriguez',
        position: 'Wellness Coach',
        bio: 'Certified Wellness Coach focused on sustainable lifestyle changes and behavioral nutrition.',
        avatar: '👩‍🔬',
        email: 'emily.rodriguez@nutrisap.com',
        specialties: ['Wellness Coaching', 'Behavioral Nutrition', 'Lifestyle Changes'],
        displayOrder: 2,
        isActive: true
      }
    ];

    for (const member of teamMembers) {
      await prisma.teamMember.create({
        data: member
      });
      console.log(`✅ Created team member: ${member.name}`);
    }

    console.log('🎉 Team members seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding team members:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTeamMembers()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });