import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'chhinhs@gmail.com' },
    update: {},
    create: {
      email: 'chhinhs@gmail.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMINISTRATOR',
      auth_provider: 'EMAIL',
      isActive: true,
    },
  });

  console.log('Created admin user:', admin);

  // Create demo users
  const demoUsers = [
    {
      email: 'admin@openplp.com',
      password: await hashPassword('admin123'),
      name: 'Administrator',
      role: 'ADMINISTRATOR',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'provincial@openplp.com',
      password: await hashPassword('provincial123'),
      name: 'Provincial Director',
      role: 'PROVINCIAL',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'district@openplp.com',
      password: await hashPassword('district123'),
      name: 'District Director',
      role: 'ZONE',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'mentor@openplp.com',
      password: await hashPassword('mentor123'),
      name: 'Mentor',
      role: 'MENTOR',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'teacher@openplp.com',
      password: await hashPassword('teacher123'),
      name: 'Teacher',
      role: 'TEACHER',
      auth_provider: 'EMAIL',
      isActive: true,
    },
    {
      email: 'officer@openplp.com',
      password: await hashPassword('officer123'),
      name: 'Officer',
      role: 'OFFICER',
      auth_provider: 'EMAIL',
      isActive: true,
    },
  ];

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`Created demo user: ${user.email}`);
  }

  // Create indicators from the PRD
  
  // Note: Geographic model is currently ignored by Prisma due to missing unique identifier
  // Skipping geographic data seeding for now

  // Seed master fields
  const masterFields = [
    { indicatorSequence: 1, indicatorMain: '១ ខ្លឹមសារ', indicatorMainEn: '1 Content', indicatorSub: '១.ខ្លឹមសារមេរៀនស្របតាមបំណែងចែកកម្មវិធីសិក្សា', indicatorSubEn: '1. Lesson content in accordance with the curriculum division', evaluationLevel: 1, aiContext: 'Evaluates whether the teacher follows the official curriculum structure and covers required content systematically. Look for alignment with learning standards and proper sequencing.' },
    { indicatorSequence: 2, indicatorMain: '១ ខ្លឹមសារ', indicatorMainEn: '1 Content', indicatorSub: '២.មានចំណេះសឹងច្បាស់លាស់លើខ្លឹមសារមេរៀនកំពុងងបង្រៀន', indicatorSubEn: '2. Have a clear knowledge of the content of the lesson being taught', evaluationLevel: 1, aiContext: 'Assesses teacher\'s subject matter expertise and confidence in delivering content. Look for accurate information, clear explanations, and ability to answer student questions.' },
    { indicatorSequence: 3, indicatorMain: '២ សម្ភារឧបទេស', indicatorMainEn: '2 Materials', indicatorSub: '៣.ប្រើប្រាស់សម្ភារៈរៀននិងបង្រៀនតាមលំដាប់លំដោយនៃខ្លឹមសារមេរៀន', indicatorSubEn: '3. Use learning and teaching materials in the order of the lesson content', evaluationLevel: 1, aiContext: 'Evaluates systematic use of teaching materials that support lesson progression. Materials should enhance understanding and be used at appropriate times.' },
    { indicatorSequence: 4, indicatorMain: '២ សម្ភារឧបទេស', indicatorMainEn: '2 Materials', indicatorSub: '៤.សម្ភារៈមានលក្ខណបច្ចេកទេស ងាយៗ និងអាចរកបាននៅក្នុងសហគមន៌', indicatorSubEn: '4. Materials are technically easy and available in the community', evaluationLevel: 1, aiContext: 'Assesses use of locally available, practical materials that students can relate to and access. Emphasizes resourcefulness and cultural relevance.' },
    { indicatorSequence: 5, indicatorMain: '២ សម្ភារឧបទេស', indicatorMainEn: '2 Materials', indicatorSub: '៥.សិស្សបានប្រើប្រាស់សម្ភារ:ក្នុងសកម្មភារៀន', indicatorSubEn: '5. Students use materials in learning activities', evaluationLevel: 1, aiContext: 'Evaluates student engagement with learning materials through hands-on activities. Students should actively manipulate and interact with materials.' },
    { indicatorSequence: 6, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '៦.អនុវត្តសកម្មភាពភ្ជាប់ទំនាក់ទំងរវាងមេរៀននមុន និងមេរៀនថ្មី', indicatorSubEn: '6. Perform activities to connect the previous lesson with the new lesson', evaluationLevel: 2, aiContext: 'Assesses how effectively teacher bridges prior knowledge with new content. Look for review activities, questioning about previous lessons, and clear connections.' },
    { indicatorSequence: 7, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '៧.បង្រៀនមានលំដាប់លំដោយស្របតាមខ្លឺមសារមេរៀន', indicatorSubEn: '7. Teach in order according to the content of the lesson', evaluationLevel: 2, aiContext: 'Evaluates logical sequencing of instruction that builds understanding progressively. Content should flow from simple to complex concepts.' },
    { indicatorSequence: 8, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '៨.កសាងបញ្ញត្តិផ្តើមពីរូបី ទៅពាក់កណ្តាលរូបី/ពាក់កណ្តាលអរូបី​ ទៅអរូបី', indicatorSubEn: '8. Build regulations from tangible to semi-tangible / semi-abstract to abstract', evaluationLevel: 2, aiContext: 'Assesses progression from concrete manipulatives to abstract concepts. Essential for mathematics and science learning, moving from hands-on to conceptual understanding.' },
    { indicatorSequence: 9, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '៩.មានបញ្ចូលល្បែងសិក្សា ឬចម្រៀងង', indicatorSubEn: '9. Includes educational games or songs', evaluationLevel: 2, aiContext: 'Evaluates use of engaging, age-appropriate activities that make learning enjoyable. Games and songs should reinforce learning objectives.' },
    { indicatorSequence: 10, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១០.លើកទឹកចិត្តសិស្សឪ្យអនុវត្តសកម្មភាពពរៀនសូត្របែបចូលរួមដូចជា ការងារបុគ្គល ដៃគូ ក្រុម', indicatorSubEn: '10. Encourage students to practice participatory learning activities such as individual work, team partners', evaluationLevel: 2, aiContext: 'Assesses variety in learning modalities - individual reflection, pair work, and group collaboration. Students should be actively engaged, not passive recipients.' },
    { indicatorSequence: 11, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១១.អន្តរកម្មសកម្ម បែបវិជ្ជមាន រវាងគ្រូនិងងសិស្ស សិស្សនិងសិស្ស', indicatorSubEn: '11. Positive interaction between teachers and students, students and students', evaluationLevel: 2, aiContext: 'Evaluates classroom climate and communication patterns. Look for respectful dialogue, encouragement, and collaborative learning environment.' },
    { indicatorSequence: 12, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១២.រៀបចំអង្គុយសិស្សបានសមស្រប ប្រកបដោយបរយាបន្ន', indicatorSubEn: '12. Arrange for students to sit properly and comfortably', evaluationLevel: 2, aiContext: 'Assesses classroom management and physical learning environment. Seating should facilitate learning activities and student interaction.' },
    { indicatorSequence: 13, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៣.ពិនិត្យចំណេះដឹងរបស់សិស្សតាមរយ:ការសួរសំណួរ ឬសិស្សធ្វើលំហាត់', indicatorSubEn: '13. Examine students\' knowledge by asking questions or doing homework', evaluationLevel: 2, aiContext: 'Evaluates formative assessment techniques during instruction. Teacher should check understanding frequently through questioning and practice activities.' },
    { indicatorSequence: 14, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៤.ខ្លឹមសារមេរៀនផ្សាភ្ជាប់នឹងបទពិសោធ និងជីវភាពរស់នៅ', indicatorSubEn: '14. Lesson content related to experience and life', evaluationLevel: 3, aiContext: 'Assesses relevance and connection to students\' daily experiences. Learning should be meaningful and applicable to their lives and cultural context.' },
    { indicatorSequence: 15, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៥.ចល័តប្រចាំក្នុងថ្នាក់រៀន ដើម្បីពន្យល់ ជួយសិស្សរៀនយឺត និងសិស្សមានតម្រូវការពិសេស', indicatorSubEn: '15. Mobile in the classroom to explain to help students learn slowly and students with special needs', evaluationLevel: 3, aiContext: 'Evaluates differentiated instruction and individual attention. Teacher should circulate, provide targeted support, and address diverse learning needs.' },
    { indicatorSequence: 16, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៦.បែងចែកក្រុមតាមវិធីជាក់លាក់ និងសម្របសម្រួលកិច្ចការក្រុម', indicatorSubEn: '16. Divide the group into specific ways and coordinate group work', evaluationLevel: 3, aiContext: 'Assesses strategic grouping and collaborative learning facilitation. Groups should be purposeful with clear roles and teacher guidance.' },
    { indicatorSequence: 17, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៧.ប្រើប្រាស់កកម្រិតសំណួរ', indicatorSubEn: '17. Use question level', evaluationLevel: 3, aiContext: 'Evaluates use of Bloom\'s taxonomy or varied question types - recall, comprehension, application, analysis. Questions should promote higher-order thinking.' },
    { indicatorSequence: 18, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៨.គ្រប់គ្រងងពេលវេលាតាមសកម្មភាពបបានល្អ', indicatorSubEn: '18. Manage time according to activities well', evaluationLevel: 3, aiContext: 'Assesses efficient lesson pacing and time allocation. Activities should have appropriate duration with smooth transitions between segments.' },
    { indicatorSequence: 19, indicatorMain: '៣ សកម្មភាពរៀន និងបង្រៀន', indicatorMainEn: '3 Learning and teaching activities', indicatorSub: '១៩.ប្រើប្រាស់បច្ចេកវិទ្យា តាមការច្នៃប្រឌិតរបស់គ្រូ', indicatorSubEn: '19. Use technology according to the teacher\'s creativity', evaluationLevel: 3, aiContext: 'Evaluates innovative and appropriate technology integration. Technology should enhance learning, not just be present for its own sake.' },
    { indicatorSequence: 20, indicatorMain: '៤ ការវាយតម្លៃ', indicatorMainEn: '4 Evaluation', indicatorSub: '២០.សង្កេត កត់ត្រាលទ្ធផល កំណត់សិស្សរៀនយឺត និងសិស្សមានតម្រូវការពិសេស ដើម្បីជួយសិស្សទាន់ពេលវេលា', indicatorSubEn: '20. Observe and record the results of students who are late and students with special needs to help students on time', evaluationLevel: 3, aiContext: 'Assesses systematic tracking of struggling learners and timely intervention. Teacher should identify learning gaps and provide immediate support.' },
    { indicatorSequence: 21, indicatorMain: '៤ ការវាយតម្លៃ', indicatorMainEn: '4 Evaluation', indicatorSub: '២១.ផ្តល់កិច្ចការសមស្របតាមកម្រិតសមត្ថភាពសិស្ស', indicatorSubEn: '21. Provide appropriate assignments according to the student\'s ability level', evaluationLevel: 3, aiContext: 'Evaluates differentiated assignments that match individual student capabilities. Tasks should challenge without overwhelming learners.' },
    { indicatorSequence: 22, indicatorMain: '៤ ការវាយតម្លៃ', indicatorMainEn: '4 Evaluation', indicatorSub: '២២.ត្រៀមកិច្ចការបន្ថែមសម្រាប់សិស្សពូកែឬកញ្ចប់កិច្ចការមុនម៉ោងកំណត់', indicatorSubEn: '22. Prepare extra work for outstanding students or assignments before the deadline', evaluationLevel: 3, aiContext: 'Assesses provision for advanced learners and early finishers. Additional challenges should extend learning rather than just keep students busy.' }
  ];

  for (const field of masterFields) {
    const masterField = await prisma.masterField.upsert({
      where: { indicatorSequence: field.indicatorSequence },
      update: {},
      create: field,
    });
    console.log(`Created master field: ${masterField.indicatorSequence}`);
  }

  console.log('Master fields created successfully');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });