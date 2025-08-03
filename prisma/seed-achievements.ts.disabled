import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAchievements() {
  console.log('Seeding badges and certificate templates...');

  // Create badges
  const badges = [
    // Mentoring badges
    {
      code: 'FIRST_SESSION',
      name: 'First Session',
      nameKh: 'វគ្គដំបូង',
      description: 'Complete your first mentoring session',
      descriptionKh: 'បញ្ចប់វគ្គណែនាំដំបូងរបស់អ្នក',
      category: 'mentoring',
      level: 1,
      criteria: { type: 'sessions_completed', count: 1 },
    },
    {
      code: 'MENTORING_NOVICE',
      name: 'Mentoring Novice',
      nameKh: 'អ្នកណែនាំថ្មី',
      description: 'Complete 5 mentoring sessions',
      descriptionKh: 'បញ្ចប់វគ្គណែនាំចំនួន ៥',
      category: 'mentoring',
      level: 1,
      criteria: { type: 'sessions_completed', count: 5 },
    },
    {
      code: 'MENTORING_EXPERT',
      name: 'Mentoring Expert',
      nameKh: 'អ្នកជំនាញណែនាំ',
      description: 'Complete 20 mentoring sessions',
      descriptionKh: 'បញ្ចប់វគ្គណែនាំចំនួន ២០',
      category: 'mentoring',
      level: 2,
      criteria: { type: 'sessions_completed', count: 20 },
    },
    {
      code: 'MENTORING_MASTER',
      name: 'Mentoring Master',
      nameKh: 'មេគ្រូណែនាំ',
      description: 'Complete 50 mentoring sessions',
      descriptionKh: 'បញ្ចប់វគ្គណែនាំចំនួន ៥០',
      category: 'mentoring',
      level: 3,
      criteria: { type: 'sessions_completed', count: 50 },
    },
    // Achievement badges
    {
      code: 'CONSISTENT_MENTOR',
      name: 'Consistent Mentor',
      nameKh: 'គ្រូណែនាំជាប់លាប់',
      description: 'Maintain active mentoring for 30 days',
      descriptionKh: 'រក្សាការណែនាំសកម្មរយៈពេល ៣០ ថ្ងៃ',
      category: 'achievement',
      level: 1,
      criteria: { type: 'mentoring_duration', days: 30 },
    },
    {
      code: 'DEDICATED_MENTOR',
      name: 'Dedicated Mentor',
      nameKh: 'គ្រូណែនាំឧស្សាហ៍',
      description: 'Maintain active mentoring for 90 days',
      descriptionKh: 'រក្សាការណែនាំសកម្មរយៈពេល ៩០ ថ្ងៃ',
      category: 'achievement',
      level: 2,
      criteria: { type: 'mentoring_duration', days: 90 },
    },
    // Excellence badges
    {
      code: 'HIGH_RATED',
      name: 'Highly Rated',
      nameKh: 'ការវាយតម្លៃខ្ពស់',
      description: 'Maintain average rating above 4.5',
      descriptionKh: 'រក្សាការវាយតម្លៃជាមធ្យមលើស ៤.៥',
      category: 'achievement',
      level: 2,
      criteria: { type: 'feedback_excellence', minRating: 4.5 },
    },
    {
      code: 'PERFECT_RATING',
      name: 'Perfect Rating',
      nameKh: 'ការវាយតម្លៃល្អឥតខ្ចោះ',
      description: 'Achieve perfect 5.0 average rating',
      descriptionKh: 'ទទួលបានការវាយតម្លៃជាមធ្យម ៥.០',
      category: 'achievement',
      level: 3,
      criteria: { type: 'feedback_excellence', minRating: 5.0 },
    },
    // Milestone badges
    {
      code: 'PEER_OBSERVER',
      name: 'Peer Observer',
      nameKh: 'អ្នកសង្កេតមិត្តភក្តិ',
      description: 'Complete 3 peer observations',
      descriptionKh: 'បញ្ចប់ការសង្កេតមិត្តភក្តិចំនួន ៣',
      category: 'milestone',
      level: 1,
      criteria: { type: 'peer_observations', count: 3 },
    },
    {
      code: 'RESOURCE_CONTRIBUTOR',
      name: 'Resource Contributor',
      nameKh: 'អ្នករួមចំណែកធនធាន',
      description: 'Share 5 educational resources',
      descriptionKh: 'ចែករំលែកធនធានអប់រំចំនួន ៥',
      category: 'milestone',
      level: 1,
      criteria: { type: 'resources_shared', count: 5 },
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }

  // Create certificate templates
  const certificateTemplates = [
    {
      code: 'MENTORING_COMPLETION',
      name: 'Mentoring Program Completion',
      nameKh: 'វិញ្ញាបនបត្របញ្ចប់កម្មវិធីណែនាំ',
      description: 'Certificate for completing a mentoring program',
      type: 'completion',
      criteria: { 
        type: 'mentoring_program_completion', 
        minSessions: 10,
        minDuration: 30,
      },
      validityDays: null, // No expiry
    },
    {
      code: 'EXCELLENCE_MENTORING',
      name: 'Excellence in Mentoring',
      nameKh: 'វិញ្ញាបនបត្រឧត្តមភាពក្នុងការណែនាំ',
      description: 'Certificate for exceptional mentoring performance',
      type: 'excellence',
      criteria: { 
        type: 'excellence_in_mentoring', 
        minRating: 4.5,
        minSessions: 20,
      },
      validityDays: 365, // Valid for 1 year
    },
    {
      code: 'PEER_OBSERVATION_LEADER',
      name: 'Peer Observation Leader',
      nameKh: 'វិញ្ញាបនបត្រអ្នកដឹកនាំការសង្កេតមិត្តភក្តិ',
      description: 'Certificate for leading peer observation initiatives',
      type: 'achievement',
      criteria: { 
        type: 'peer_observation_leadership', 
        minObservations: 10,
        minFeedback: 20,
      },
      validityDays: null,
    },
    {
      code: 'PROFESSIONAL_DEVELOPMENT',
      name: 'Professional Development Achievement',
      nameKh: 'វិញ្ញាបនបត្រសមិទ្ធផលអភិវឌ្ឍន៍វិជ្ជាជីវៈ',
      description: 'Certificate for significant professional growth',
      type: 'achievement',
      criteria: { 
        type: 'professional_development', 
        requiredBadges: ['MENTORING_EXPERT', 'HIGH_RATED', 'RESOURCE_CONTRIBUTOR'],
      },
      validityDays: null,
    },
  ];

  for (const template of certificateTemplates) {
    await prisma.certificateTemplate.upsert({
      where: { code: template.code },
      update: template,
      create: template,
    });
  }

  console.log('Badges and certificate templates seeded successfully!');
}

seedAchievements()
  .catch((error) => {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });