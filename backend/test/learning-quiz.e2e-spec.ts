import { INestApplication } from '@nestjs/common';
import { hash } from 'bcrypt';
import { LessonType, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { createConfiguredTestApp } from './create-test-app';

const password = 'e2ePass12';

interface AuthTokensBody {
  accessToken: string;
}

interface ApiErrorBody {
  code: string;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

const quizContent = JSON.stringify({
  version: 1,
  passingScorePercent: 50,
  questions: [
    {
      id: 'q1',
      prompt: 'Pick two',
      options: [
        { id: 'a', text: '1' },
        { id: 'b', text: '2' },
      ],
      correctOptionId: 'b',
    },
  ],
});

describe('Learning quiz (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createConfiguredTestApp();
    const prisma = app.get(PrismaService);
    if (process.env.NODE_ENV === 'test') {
      await prisma.$connect();
    }
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET quiz returns sanitized payload; submit scores and persists progress', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('quiz-ins');
    const learnerEmail = uniqueEmail('quiz-stu');

    const instructor = await prisma.user.create({
      data: {
        email: instructorEmail,
        passwordHash: await hash(password, 10),
        role: Role.INSTRUCTOR,
      },
    });

    const insLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: instructorEmail, password })
      .expect(201);
    const insToken = (insLogin.body as AuthTokensBody).accessToken;

    const slug = `e2e-quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Quiz Course',
        slug,
        description: 'test',
      })
      .expect(201);

    const courseId = (courseRes.body as { id: string }).id;

    const mod = await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'Module 1', order: 1 })
      .expect(201);

    const moduleId = (mod.body as { id: string }).id;

    const les = await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Quiz lesson',
        type: LessonType.QUIZ,
        order: 1,
        content: quizContent,
      })
      .expect(201);

    const lessonId = (les.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${insToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: learnerEmail, password })
      .expect(201);

    const stuLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: learnerEmail, password })
      .expect(201);
    const stuToken = (stuLogin.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(201);

    const quizGet = await request(app.getHttpServer())
      .get(`/api/v1/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(200);

    const quizBody = quizGet.body as {
      lessonId: string;
      title: string;
      quiz: { questions: unknown[]; passingScorePercent: number };
    };
    expect(quizBody.lessonId).toBe(lessonId);
    expect(quizBody.quiz.passingScorePercent).toBe(50);
    expect(JSON.stringify(quizBody)).not.toContain('correctOptionId');

    const submit = await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/quiz/submit`)
      .set('Authorization', `Bearer ${stuToken}`)
      .send({ answers: { q1: 'b' } })
      .expect(201);

    const submitBody = submit.body as {
      score: number;
      completed: boolean;
      progress: { quizScore: number | null; completed: boolean };
      courseProgress: number;
    };
    expect(submitBody.score).toBe(100);
    expect(submitBody.completed).toBe(true);
    expect(submitBody.progress.quizScore).toBe(100);
    expect(submitBody.progress.completed).toBe(true);

    await prisma.user.delete({ where: { id: instructor.id } });
    await prisma.user.deleteMany({ where: { email: learnerEmail } });
  });

  it('GET quiz on non-QUIZ lesson returns QUIZ_NOT_QUIZ_TYPE', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('quiz-ins2');
    const learnerEmail = uniqueEmail('quiz-stu2');

    await prisma.user.create({
      data: {
        email: instructorEmail,
        passwordHash: await hash(password, 10),
        role: Role.INSTRUCTOR,
      },
    });

    const insLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: instructorEmail, password })
      .expect(201);
    const insToken = (insLogin.body as AuthTokensBody).accessToken;

    const slug = `e2e-text-${Date.now()}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'Text Course', slug, description: 'x' })
      .expect(201);
    const courseId = (courseRes.body as { id: string }).id;

    const mod = await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'M1', order: 1 })
      .expect(201);
    const moduleId = (mod.body as { id: string }).id;

    const les = await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Text lesson',
        type: LessonType.TEXT,
        order: 1,
        content: 'hello',
      })
      .expect(201);
    const lessonId = (les.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${insToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: learnerEmail, password })
      .expect(201);
    const stuLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: learnerEmail, password })
      .expect(201);
    const stuToken = (stuLogin.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(400)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('QUIZ_NOT_QUIZ_TYPE');
      });

    await prisma.user.deleteMany({
      where: { email: { in: [instructorEmail, learnerEmail] } },
    });
  });

  it('GET quiz with invalid JSON content returns QUIZ_INVALID_JSON', async () => {
    const prisma = app.get(PrismaService);
    const instructorEmail = uniqueEmail('quiz-ins3');
    const learnerEmail = uniqueEmail('quiz-stu3');

    await prisma.user.create({
      data: {
        email: instructorEmail,
        passwordHash: await hash(password, 10),
        role: Role.INSTRUCTOR,
      },
    });

    const insLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: instructorEmail, password })
      .expect(201);
    const insToken = (insLogin.body as AuthTokensBody).accessToken;

    const slug = `e2e-badjson-${Date.now()}`;
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/instructor/courses')
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'Bad Quiz', slug, description: 'x' })
      .expect(201);
    const courseId = (courseRes.body as { id: string }).id;

    const mod = await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({ title: 'M1', order: 1 })
      .expect(201);
    const moduleId = (mod.body as { id: string }).id;

    const les = await request(app.getHttpServer())
      .post(`/api/v1/instructor/modules/${moduleId}/lessons`)
      .set('Authorization', `Bearer ${insToken}`)
      .send({
        title: 'Broken quiz',
        type: LessonType.QUIZ,
        order: 1,
        content: 'not-json',
      })
      .expect(201);
    const lessonId = (les.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/api/v1/instructor/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${insToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: learnerEmail, password })
      .expect(201);
    const stuLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: learnerEmail, password })
      .expect(201);
    const stuToken = (stuLogin.body as AuthTokensBody).accessToken;

    await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/lessons/${lessonId}/quiz`)
      .set('Authorization', `Bearer ${stuToken}`)
      .expect(400)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('QUIZ_INVALID_JSON');
      });

    await prisma.user.deleteMany({
      where: { email: { in: [instructorEmail, learnerEmail] } },
    });
  });
});
