import { BadRequestException, ConflictException } from '@nestjs/common';
import { FriendRelationStatus } from '@prisma/client';
import { SocialService } from './social.service';

describe('SocialService', () => {
  const requesterId = 'user_req';
  const targetId = 'user_tgt';
  const presence = {
    getPresenceMap: jest.fn().mockReturnValue({}),
  };

  it('sendFriendRequest rejects self-target', async () => {
    const prisma = {
      user: { findUnique: jest.fn() },
      friendRelation: { findFirst: jest.fn(), create: jest.fn() },
    };
    const service = new SocialService(prisma as never, presence as never);

    await expect(
      service.sendFriendRequest(requesterId, requesterId),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('sendFriendRequest creates PENDING when no block or existing relation', async () => {
    const row = {
      id: 'rel_1',
      status: FriendRelationStatus.PENDING,
      createdAt: new Date(),
      requester: { id: requesterId },
      addressee: { id: targetId },
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: targetId }) },
      friendRelation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(row),
      },
    };
    const service = new SocialService(prisma as never, presence as never);

    const result = await service.sendFriendRequest(requesterId, targetId);

    expect(prisma.friendRelation.findFirst).toHaveBeenCalledTimes(2);
    expect(prisma.friendRelation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          requesterId,
          addresseeId: targetId,
          status: FriendRelationStatus.PENDING,
        },
      }),
    );
    expect(result).toEqual(row);
  });

  it('sendFriendRequest rejects duplicate pending request', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: targetId }) },
      friendRelation: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ status: FriendRelationStatus.PENDING }),
        create: jest.fn(),
      },
    };
    const service = new SocialService(prisma as never, presence as never);

    await expect(
      service.sendFriendRequest(requesterId, targetId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.friendRelation.create).not.toHaveBeenCalled();
  });

  it('acceptFriendRequest updates relation to ACCEPTED', async () => {
    const relation = {
      id: 'rel_accept',
      requesterId: targetId,
      addresseeId: requesterId,
      status: FriendRelationStatus.PENDING,
    };
    const updated = {
      id: relation.id,
      status: FriendRelationStatus.ACCEPTED,
      updatedAt: new Date(),
      requester: { id: targetId },
      addressee: { id: requesterId },
    };
    const prisma = {
      friendRelation: {
        findFirst: jest.fn().mockResolvedValue(relation),
        update: jest.fn().mockResolvedValue(updated),
      },
    };
    const service = new SocialService(prisma as never, presence as never);

    const result = await service.acceptFriendRequest(requesterId, relation.id);

    expect(prisma.friendRelation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: relation.id },
        data: { status: FriendRelationStatus.ACCEPTED },
      }),
    );
    expect(result).toEqual(updated);
  });
});
