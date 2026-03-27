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
  console.log(`Admin created: ${admin.email}`);

  // Create student user with TelegramAccount
  const studentPassword = await bcrypt.hash('student123456', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@aibot.kz' },
    update: { passwordHash: studentPassword },
    create: {
      email: 'student@aibot.kz',
      passwordHash: studentPassword,
      firstName: 'Студент',
      lastName: 'Тестовый',
      middleName: 'Иванович',
      role: 'STUDENT',
    },
  });

  // Link TelegramAccount to student
  await prisma.telegramAccount.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      telegramId: '123456789',
      username: 'test_student',
      firstName: 'Студент',
      lastName: 'Тестовый',
    },
  });
  console.log(`Student created: ${student.email} (telegramId: 123456789)`);

  // Create demo course with video
  const course = await prisma.course.upsert({
    where: { slug: 'ai-basics' },
    update: {},
    create: {
      title: 'Основы искусственного интеллекта',
      slug: 'ai-basics',
      description: 'Вводный курс по искусственному интеллекту. Вы узнаете основные концепции AI, машинного обучения и нейронных сетей.',
      price: 0,
      isFree: true,
      isPublished: true,
    },
  });
  console.log(`Course created: ${course.title}`);

  // Create module
  const mod = await prisma.module.upsert({
    where: { id: 'seed-module-1' },
    update: {},
    create: {
      id: 'seed-module-1',
      courseId: course.id,
      title: 'Введение в AI',
      description: 'Что такое искусственный интеллект',
      order: 1,
      isPublished: true,
    },
  });

  // Create video lesson
  await prisma.lesson.upsert({
    where: { id: 'seed-lesson-1' },
    update: { videoUrl: '/api/videos/intro.mp4' },
    create: {
      id: 'seed-lesson-1',
      moduleId: mod.id,
      title: 'Введение в искусственный интеллект',
      description: 'Видео-урок: основы AI и его применение',
      type: 'VIDEO',
      videoUrl: '/api/videos/intro.mp4',
      order: 1,
      isPublished: true,
      isFree: true,
    },
  });

  // Enroll student
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id, status: 'ACTIVE' },
  });
  console.log(`Student enrolled in: ${course.title}`);

  console.log('\nSeed completed!');
  console.log('Admin:   admin@aibot.kz / admin123456');
  console.log('Student: student@aibot.kz / student123456 (telegramId: 123456789)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
