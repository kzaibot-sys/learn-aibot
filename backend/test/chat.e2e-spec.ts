import { INestApplication } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { createConfiguredTestApp } from './create-test-app';

const password = 'e2eChat12';

interface AuthTokensBody {
  accessToken: string;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

describe('Chat rooms and messages (e2e)', () => {
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

  it('creates a DIRECT room and sends a message', async () => {
    const prisma = app.get(PrismaService);
    const emailA = uniqueEmail('chat-a');
    const emailB = uniqueEmail('chat-b');

    const userA = await prisma.user.create({
      data: {
        email: emailA,
        passwordHash: await hash(password, 10),
        role: Role.STUDENT,
      },
    });
    const userB = await prisma.user.create({
      data: {
        email: emailB,
        passwordHash: await hash(password, 10),
        role: Role.STUDENT,
      },
    });

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: emailA, password })
      .expect(201);
    const tokenA = (loginA.body as AuthTokensBody).accessToken;

    const roomRes = await request(app.getHttpServer())
      .post('/api/v1/chat/rooms')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'DIRECT', peerUserId: userB.id })
      .expect(201);

    const roomId = (roomRes.body as { id: string }).id;
    expect(typeof roomId).toBe('string');

    const msgRes = await request(app.getHttpServer())
      .post(`/api/v1/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Hello from e2e' })
      .expect(201);

    expect((msgRes.body as { content: string }).content).toBe('Hello from e2e');

    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/chat/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const messages = (listRes.body as { messages: Array<{ content: string }> })
      .messages;
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages.some((m) => m.content === 'Hello from e2e')).toBe(true);

    await prisma.chatRoom.delete({ where: { id: roomId } });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
  });
});
