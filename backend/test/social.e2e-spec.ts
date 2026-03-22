import { INestApplication } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { createConfiguredTestApp } from './create-test-app';

const password = 'e2eSocial12';

interface AuthTokensBody {
  accessToken: string;
}

interface ApiErrorBody {
  code: string;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

describe('Social friends (e2e)', () => {
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

  it('request then accept yields accepted friend list', async () => {
    const prisma = app.get(PrismaService);
    const emailA = uniqueEmail('soc-a');
    const emailB = uniqueEmail('soc-b');

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
        role: Role.INSTRUCTOR,
      },
    });

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: emailA, password })
      .expect(201);
    const tokenA = (loginA.body as AuthTokensBody).accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: emailB, password })
      .expect(201);
    const tokenB = (loginB.body as AuthTokensBody).accessToken;

    const reqRes = await request(app.getHttpServer())
      .post('/api/v1/social/friends/request')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetUserId: userB.id })
      .expect(201);

    const requestId = (reqRes.body as { id: string }).id;
    expect(typeof requestId).toBe('string');

    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/social/friends/${requestId}/accept`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(201);

    expect((acceptRes.body as { status: string }).status).toBe('ACCEPTED');

    const friendsA = await request(app.getHttpServer())
      .get('/api/v1/social/friends')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const friendsBody = friendsA.body as {
      friends: Array<{ friend: { id: string } }>;
    };
    expect(friendsBody.friends).toHaveLength(1);
    expect(friendsBody.friends[0].friend.id).toBe(userB.id);

    await prisma.friendRelation.deleteMany({
      where: {
        OR: [{ requesterId: userA.id }, { addresseeId: userA.id }],
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id] } },
    });
  });

  it('returns 401 without Bearer token for friends list', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/social/friends')
      .expect(401)
      .expect(({ body }: { body: ApiErrorBody }) => {
        expect(body.code).toBe('UNAUTHORIZED');
      });
  });
});
