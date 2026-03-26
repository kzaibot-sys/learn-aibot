/**
 * reset-and-seed.js
 * Cleans the database and creates minimal test data for the LMS platform.
 *
 * Usage: DATABASE_URL="..." node scripts/reset-and-seed.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_gJhxlsQ2F9tW@ep-lingering-sun-a4xz7f6z-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

async function main() {
  console.log("=== Cleaning database ===");

  // Delete in FK-safe order
  const deletions = [
    prisma.lessonProgress.deleteMany(),
    prisma.taskSubmission.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.task.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.module.deleteMany(),
    prisma.course.deleteMany(),
    prisma.telegramSession.deleteMany(),
    prisma.telegramAccount.deleteMany(),
    prisma.user.deleteMany(),
  ];

  for (const del of deletions) {
    await del;
  }
  console.log("All tables cleared.");

  // --- Create admin user ---
  console.log("\n=== Creating users ===");
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@aibot.kz",
      passwordHash: adminHash,
      firstName: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`Admin  : ${admin.id} (${admin.email})`);

  // --- Create student user ---
  const studentHash = await bcrypt.hash("student123", 12);
  const student = await prisma.user.create({
    data: {
      email: "student@aibot.kz",
      passwordHash: studentHash,
      firstName: "Студент",
      role: "STUDENT",
    },
  });
  console.log(`Student: ${student.id} (${student.email})`);

  // --- Create course ---
  console.log("\n=== Creating course ===");
  const course = await prisma.course.create({
    data: {
      title: "AI Бот жасау курсы",
      slug: "ai-bot-course",
      description:
        "Толық AI бот жасау курсы — нөлден бастап кәсіби деңгейге дейін",
      price: 4990,
      currency: "KZT",
      isPublished: true,
    },
  });
  console.log(`Course : ${course.id} (${course.slug})`);

  // --- Create module ---
  console.log("\n=== Creating module ===");
  const mod = await prisma.module.create({
    data: {
      courseId: course.id,
      title: "Кіріспе",
      order: 1,
      isPublished: true,
    },
  });
  console.log(`Module : ${mod.id} (${mod.title})`);

  // --- Create lesson ---
  console.log("\n=== Creating lesson ===");
  const lesson = await prisma.lesson.create({
    data: {
      moduleId: mod.id,
      title: "AI Бот дүниесіне кіріспе",
      type: "VIDEO",
      videoUrl: "https://www.youtube.com/watch?v=D2xu_ErLQxQ",
      duration: 15,
      content:
        "<p>Бұл сабақта AI бот жасаудың негіздерімен танысамыз.</p>",
      order: 1,
      isPublished: true,
    },
  });
  console.log(`Lesson : ${lesson.id} (${lesson.title})`);

  // --- Enroll both users ---
  console.log("\n=== Enrolling users ===");
  const enrollAdmin = await prisma.enrollment.create({
    data: {
      userId: admin.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });
  console.log(`Enrollment (admin)  : ${enrollAdmin.id}`);

  const enrollStudent = await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });
  console.log(`Enrollment (student): ${enrollStudent.id}`);

  // --- Create lesson progress (not completed — fresh start) ---
  console.log("\n=== Creating lesson progress ===");
  const progress = await prisma.lessonProgress.create({
    data: {
      userId: student.id,
      lessonId: lesson.id,
      completed: false,
      watchedSec: 0,
    },
  });
  console.log(`Progress (student)  : ${progress.id} (completed: false)`);

  // --- Summary ---
  console.log("\n========== SEED COMPLETE ==========");
  console.log(`Admin ID       : ${admin.id}`);
  console.log(`Student ID     : ${student.id}`);
  console.log(`Course ID      : ${course.id}`);
  console.log(`Module ID      : ${mod.id}`);
  console.log(`Lesson ID      : ${lesson.id}`);
  console.log(`Enrollment IDs : ${enrollAdmin.id}, ${enrollStudent.id}`);
  console.log(`Progress ID    : ${progress.id}`);
  console.log("===================================");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
