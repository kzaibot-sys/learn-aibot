import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRelationStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';

const userPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
  ) {}

  async sendFriendRequest(requesterId: string, targetUserId: string) {
    if (targetUserId === requesterId) {
      throw new BadRequestException({
        code: 'FRIEND_CANNOT_REQUEST_SELF',
        message: 'Cannot send a friend request to yourself',
      });
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    await this.assertNoBlockBetween(requesterId, targetUserId);

    const existing = await this.prisma.friendRelation.findFirst({
      where: {
        OR: [
          { requesterId: requesterId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: requesterId },
        ],
      },
    });

    if (existing?.status === FriendRelationStatus.PENDING) {
      throw new ConflictException({
        code: 'FRIEND_REQUEST_PENDING',
        message: 'A friend request is already pending between these users',
      });
    }

    if (existing?.status === FriendRelationStatus.ACCEPTED) {
      throw new ConflictException({
        code: 'FRIEND_ALREADY_ACCEPTED',
        message: 'You are already friends with this user',
      });
    }

    if (existing?.status === FriendRelationStatus.BLOCKED) {
      throw new ForbiddenException({
        code: 'FRIEND_BLOCKED',
        message: 'Cannot send a friend request due to a block',
      });
    }

    return this.prisma.friendRelation.create({
      data: {
        requesterId,
        addresseeId: targetUserId,
        status: FriendRelationStatus.PENDING,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        requester: { select: userPublicSelect },
        addressee: { select: userPublicSelect },
      },
    });
  }

  async acceptFriendRequest(userId: string, requestId: string) {
    const relation = await this.prisma.friendRelation.findFirst({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendRelationStatus.PENDING,
      },
    });

    if (!relation) {
      throw new NotFoundException({
        code: 'FRIEND_REQUEST_NOT_FOUND',
        message: 'Friend request not found',
      });
    }

    return this.prisma.friendRelation.update({
      where: { id: relation.id },
      data: { status: FriendRelationStatus.ACCEPTED },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        requester: { select: userPublicSelect },
        addressee: { select: userPublicSelect },
      },
    });
  }

  async declineFriendRequest(userId: string, requestId: string) {
    const relation = await this.prisma.friendRelation.findFirst({
      where: {
        id: requestId,
        addresseeId: userId,
        status: FriendRelationStatus.PENDING,
      },
    });

    if (!relation) {
      throw new NotFoundException({
        code: 'FRIEND_REQUEST_NOT_FOUND',
        message: 'Friend request not found',
      });
    }

    await this.prisma.friendRelation.delete({
      where: { id: relation.id },
    });

    return { ok: true as const };
  }

  async listFriendRequests(userId: string) {
    const [incoming, outgoing] = await Promise.all([
      this.prisma.friendRelation.findMany({
        where: {
          addresseeId: userId,
          status: FriendRelationStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          requester: { select: userPublicSelect },
        },
      }),
      this.prisma.friendRelation.findMany({
        where: {
          requesterId: userId,
          status: FriendRelationStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          addressee: { select: userPublicSelect },
        },
      }),
    ]);

    return { incoming, outgoing };
  }

  async listFriends(userId: string) {
    const rows = await this.prisma.friendRelation.findMany({
      where: {
        status: FriendRelationStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        requesterId: true,
        addresseeId: true,
        requester: { select: userPublicSelect },
        addressee: { select: userPublicSelect },
      },
    });

    const friendUsers = rows.map((row) =>
      row.requesterId === userId ? row.addressee : row.requester,
    );
    const presenceMap = this.presenceService.getPresenceMap(
      friendUsers.map((friend) => friend.id),
    );

    return {
      friends: rows.map((row) => {
        const friend =
          row.requesterId === userId ? row.addressee : row.requester;
        return {
          relationId: row.id,
          friend: {
            ...friend,
            ...presenceMap[friend.id],
          },
          since: row.updatedAt,
        };
      }),
    };
  }

  async blockUser(blockerId: string, targetUserId: string) {
    if (targetUserId === blockerId) {
      throw new BadRequestException({
        code: 'FRIEND_CANNOT_BLOCK_SELF',
        message: 'Cannot block yourself',
      });
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.friendRelation.deleteMany({
        where: {
          OR: [
            { requesterId: blockerId, addresseeId: targetUserId },
            { requesterId: targetUserId, addresseeId: blockerId },
          ],
        },
      });

      await tx.friendRelation.create({
        data: {
          requesterId: blockerId,
          addresseeId: targetUserId,
          status: FriendRelationStatus.BLOCKED,
        },
      });
    });

    return { ok: true as const };
  }

  private async assertNoBlockBetween(a: string, b: string) {
    const blocked = await this.prisma.friendRelation.findFirst({
      where: {
        status: FriendRelationStatus.BLOCKED,
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });

    if (blocked) {
      throw new ForbiddenException({
        code: 'FRIEND_BLOCKED',
        message: 'Cannot interact due to a block between these users',
      });
    }
  }
}
