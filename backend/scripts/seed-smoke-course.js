const { Role, CourseStatus } = require("@prisma/client");
const { createPrismaClient } = require("./lib/prisma-client");

async function seedSmokeCourse() {
  const prisma = createPrismaClient();

  const owner = await prisma.user.upsert({
    where: { email: "instructor.seed@example.com" },
    update: { role: Role.INSTRUCTOR },
    create: {
      email: "instructor.seed@example.com",
      passwordHash: "seed-hash",
      role: Role.INSTRUCTOR,
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "smoke-course-1" },
    update: {
      status: CourseStatus.PUBLISHED,
      title: "Smoke Course 1",
      ownerId: owner.id,
    },
    create: {
      slug: "smoke-course-1",
      title: "Smoke Course 1",
      description: "Seeded for smoke test",
      category: "AI",
      level: "Beginner",
      language: "ru",
      status: CourseStatus.PUBLISHED,
      ownerId: owner.id,
    },
  });

  const moduleOne = await prisma.module.upsert({
    where: {
      courseId_order: {
        courseId: course.id,
        order: 1,
      },
    },
    update: {
      title: "Getting Started",
    },
    create: {
      title: "Getting Started",
      order: 1,
      courseId: course.id,
    },
  });

  await prisma.lesson.upsert({
    where: {
      moduleId_order: {
        moduleId: moduleOne.id,
        order: 1,
      },
    },
    update: {
      title: "Welcome",
      type: "VIDEO",
      contentUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      content: null,
    },
    create: {
      title: "Welcome",
      type: "VIDEO",
      order: 1,
      contentUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      moduleId: moduleOne.id,
    },
  });

  await prisma.lesson.upsert({
    where: {
      moduleId_order: {
        moduleId: moduleOne.id,
        order: 2,
      },
    },
    update: {
      title: "Quick Quiz",
      type: "QUIZ",
      content:
        '{"questions":[{"id":"q1","text":"What is AI?","choices":["Machine learning","Human-only process"],"correctIndex":0}]}',
      contentUrl: null,
    },
    create: {
      title: "Quick Quiz",
      type: "QUIZ",
      order: 2,
      content:
        '{"questions":[{"id":"q1","text":"What is AI?","choices":["Machine learning","Human-only process"],"correctIndex":0}]}',
      moduleId: moduleOne.id,
    },
  });

  console.log("SEEDED_COURSE", course.id);
  await prisma.$disconnect();
}

if (require.main === module) {
  seedSmokeCourse().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { seedSmokeCourse };
