import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aibot.kz' },
    update: { passwordHash: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@aibot.kz',
      passwordHash: adminPassword,
      firstName: 'Админ',
      lastName: 'AiBot',
      role: 'ADMIN',
    },
  });
  console.log(`Admin created: ${admin.email} (id: ${admin.id})`);

  // Create student user
  const studentPassword = await bcrypt.hash('student123456', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@aibot.kz' },
    update: { passwordHash: studentPassword },
    create: {
      email: 'student@aibot.kz',
      passwordHash: studentPassword,
      firstName: 'Студент',
      lastName: 'Тестовый',
      role: 'STUDENT',
    },
  });
  console.log(`Student created: ${student.email} (id: ${student.id})`);

  // Create a demo course
  const course = await prisma.course.upsert({
    where: { slug: 'ai-basics' },
    update: {},
    create: {
      title: 'Основы искусственного интеллекта',
      slug: 'ai-basics',
      description: 'Вводный курс по искусственному интеллекту. Вы узнаете основные концепции AI, машинного обучения и нейронных сетей.',
      price: 0,
      isFree: true,
      published: true,
    },
  });
  console.log(`Course created: ${course.title} (slug: ${course.slug})`);

  // Create modules
  const module1 = await prisma.module.upsert({
    where: { id: 'seed-module-1' },
    update: {},
    create: {
      id: 'seed-module-1',
      courseId: course.id,
      title: 'Введение в AI',
      description: 'Что такое искусственный интеллект и где он применяется',
      order: 1,
      published: true,
    },
  });

  const module2 = await prisma.module.upsert({
    where: { id: 'seed-module-2' },
    update: {},
    create: {
      id: 'seed-module-2',
      courseId: course.id,
      title: 'Машинное обучение',
      description: 'Основы машинного обучения и типы задач',
      order: 2,
      published: true,
    },
  });

  // Create lessons
  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-1' },
    update: {},
    create: {
      id: 'seed-lesson-1',
      moduleId: module1.id,
      title: 'Что такое AI?',
      description: 'Определение и история искусственного интеллекта',
      type: 'TEXT',
      content: '<h2>Что такое искусственный интеллект?</h2><p>Искусственный интеллект (AI) — это область компьютерных наук, которая занимается созданием интеллектуальных машин, способных выполнять задачи, требующие человеческого интеллекта.</p><p>AI включает в себя:</p><ul><li>Машинное обучение</li><li>Обработку естественного языка</li><li>Компьютерное зрение</li><li>Робототехнику</li></ul>',
      order: 1,
      published: true,
      isFree: true,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-2' },
    update: {},
    create: {
      id: 'seed-lesson-2',
      moduleId: module1.id,
      title: 'Применение AI в бизнесе',
      description: 'Реальные кейсы использования AI',
      type: 'TEXT',
      content: '<h2>AI в бизнесе</h2><p>Искусственный интеллект активно применяется в различных отраслях:</p><ul><li><strong>Маркетинг:</strong> персонализация, чат-боты, анализ данных</li><li><strong>Финансы:</strong> определение мошенничества, кредитный скоринг</li><li><strong>Медицина:</strong> диагностика, анализ снимков</li><li><strong>Образование:</strong> персональные AI-помощники</li></ul>',
      order: 2,
      published: true,
      isFree: true,
    },
  });

  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-3' },
    update: {},
    create: {
      id: 'seed-lesson-3',
      moduleId: module2.id,
      title: 'Типы машинного обучения',
      description: 'Supervised, unsupervised и reinforcement learning',
      type: 'TEXT',
      content: '<h2>Три типа машинного обучения</h2><p><strong>1. Обучение с учителем (Supervised Learning)</strong> — модель учится на размеченных данных.</p><p><strong>2. Обучение без учителя (Unsupervised Learning)</strong> — модель находит закономерности в неразмеченных данных.</p><p><strong>3. Обучение с подкреплением (Reinforcement Learning)</strong> — модель учится через взаимодействие со средой и получение наград.</p>',
      order: 1,
      published: true,
    },
  });

  // Enroll student in demo course
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: { userId: student.id, courseId: course.id },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
  });
  console.log(`Student enrolled in: ${course.title}`);

  console.log('\nSeed completed!');
  console.log('---');
  console.log('Admin:   admin@aibot.kz / admin123456');
  console.log('Student: student@aibot.kz / student123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
