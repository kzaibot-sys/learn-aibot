import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRoomType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';
import { CreateRoomDto } from './dto/create-room.dto';

const messageSelect = {
  id: true,
  roomId: true,
  userId: true,
  content: true,
  createdAt: true,
} as const;

export type ChatMessagePayload = {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: Date;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenceService: PresenceService,
  ) {}

  async listMyRooms(userId: string) {
    const memberships = await this.prisma.chatRoomMember.findMany({
      where: { userId },
      select: {
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            createdAt: true,
            course: { select: { id: true, title: true, slug: true } },
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      rooms: memberships
        .map((m) => this.toRoomPayload(m.room, userId))
        .filter(Boolean),
    };
  }

  async createRoom(userId: string, dto: CreateRoomDto) {
    if (dto.type === ChatRoomType.DIRECT) {
      return this.createOrGetDirectRoom(userId, dto);
    }
    return this.createOrGetCourseRoom(userId, dto);
  }

  private async createOrGetDirectRoom(userId: string, dto: CreateRoomDto) {
    const peerUserId = dto.peerUserId;
    if (!peerUserId) {
      throw new BadRequestException({
        code: 'CHAT_PEER_REQUIRED',
        message: 'peerUserId is required for DIRECT rooms',
      });
    }

    if (peerUserId === userId) {
      throw new BadRequestException({
        code: 'CHAT_INVALID_DIRECT_PEER',
        message: 'Cannot open a direct chat with yourself',
      });
    }

    const peer = await this.prisma.user.findUnique({
      where: { id: peerUserId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!peer) {
      throw new NotFoundException({
        code: 'CHAT_PEER_NOT_FOUND',
        message: 'Peer user not found',
      });
    }

    const existing = await this.findExistingDirectRoom(userId, peerUserId);
    if (existing) {
      return this.toRoomPayload(existing, userId);
    }

    const name =
      dto.name?.trim() ||
      this.formatPeerRoomName(peer.firstName, peer.lastName, peer.email);

    const created = await this.prisma.chatRoom.create({
      data: {
        name,
        type: ChatRoomType.DIRECT,
        members: {
          create: [{ userId }, { userId: peerUserId }],
        },
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return this.toRoomPayload(created, userId);
  }

  private formatPeerRoomName(
    firstName: string | null,
    lastName: string | null,
    email: string,
  ): string {
    const parts = [firstName, lastName].filter(Boolean).join(' ').trim();
    return parts.length > 0 ? parts : email;
  }

  private async findExistingDirectRoom(userId: string, peerUserId: string) {
    const myRooms = await this.prisma.chatRoomMember.findMany({
      where: { userId },
      select: { roomId: true },
    });
    const roomIds = myRooms.map((m) => m.roomId);
    if (roomIds.length === 0) {
      return null;
    }

    const peerOverlap = await this.prisma.chatRoomMember.findMany({
      where: {
        userId: peerUserId,
        roomId: { in: roomIds },
      },
      select: { roomId: true },
    });

    for (const { roomId } of peerOverlap) {
      const room = await this.prisma.chatRoom.findFirst({
        where: {
          id: roomId,
          type: ChatRoomType.DIRECT,
        },
        include: { members: true },
      });
      if (room && room.members.length === 2) {
        return this.prisma.chatRoom.findUnique({
          where: { id: room.id },
          include: {
            course: { select: { id: true, title: true, slug: true } },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        });
      }
    }

    return null;
  }

  private async createOrGetCourseRoom(userId: string, dto: CreateRoomDto) {
    const courseId = dto.courseId;
    if (!courseId) {
      throw new BadRequestException({
        code: 'CHAT_COURSE_REQUIRED',
        message: 'courseId is required for COURSE rooms',
      });
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      throw new NotFoundException({
        code: 'CHAT_COURSE_NOT_FOUND',
        message: 'Course not found',
      });
    }

    const existing = await this.prisma.chatRoom.findFirst({
      where: {
        type: ChatRoomType.COURSE,
        courseId,
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      const isMember = existing.members.some((m) => m.userId === userId);
      if (!isMember) {
        await this.prisma.chatRoomMember.create({
          data: { roomId: existing.id, userId },
        });
        const reloaded = await this.prisma.chatRoom.findUnique({
          where: { id: existing.id },
          include: {
            course: { select: { id: true, title: true, slug: true } },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });
        return this.toRoomPayload(reloaded, userId);
      }
      return this.toRoomPayload(existing, userId);
    }

    const name = dto.name?.trim() || course.title;

    const created = await this.prisma.chatRoom.create({
      data: {
        name,
        type: ChatRoomType.COURSE,
        courseId,
        members: {
          create: [{ userId }],
        },
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return this.toRoomPayload(created, userId);
  }

  async assertRoomMember(roomId: string, userId: string) {
    const member = await this.prisma.chatRoomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
    });
    if (!member) {
      throw new ForbiddenException({
        code: 'CHAT_NOT_MEMBER',
        message: 'You are not a member of this chat room',
      });
    }
  }

  async getRoomOrThrow(roomId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new NotFoundException({
        code: 'CHAT_ROOM_NOT_FOUND',
        message: 'Chat room not found',
      });
    }
    return room;
  }

  async listMessages(
    userId: string,
    roomId: string,
    limit: number,
    beforeMessageId?: string,
  ) {
    await this.getRoomOrThrow(roomId);
    await this.assertRoomMember(roomId, userId);

    let beforeCreatedAt: Date | undefined;
    if (beforeMessageId) {
      const cursor = await this.prisma.chatMessage.findUnique({
        where: { id: beforeMessageId },
      });
      if (!cursor || cursor.roomId !== roomId) {
        throw new BadRequestException({
          code: 'CHAT_INVALID_MESSAGE_CURSOR',
          message: 'Invalid before message id for this room',
        });
      }
      beforeCreatedAt = cursor.createdAt;
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        roomId,
        ...(beforeCreatedAt ? { createdAt: { lt: beforeCreatedAt } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: messageSelect,
    });

    return {
      messages: messages.reverse(),
    };
  }

  async createMessage(
    userId: string,
    roomId: string,
    content: string,
  ): Promise<ChatMessagePayload> {
    await this.getRoomOrThrow(roomId);
    await this.assertRoomMember(roomId, userId);

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId,
        userId,
        content,
      },
      select: messageSelect,
    });

    return message;
  }

  private toRoomPayload(
    room: {
      id: string;
      name: string;
      type: ChatRoomType;
      createdAt?: Date;
      course?: { id: string; title: string; slug: string } | null;
      members?: Array<{
        userId?: string;
        user: {
          id: string;
          email: string;
          firstName: string | null;
          lastName: string | null;
        };
      }>;
      messages?: Array<{
        id: string;
        content: string;
        createdAt: Date;
        userId: string;
      }>;
    } | null,
    viewerUserId: string,
  ) {
    if (!room) {
      return null;
    }

    const peer =
      room.type === ChatRoomType.DIRECT
        ? room.members?.find((member) => member.user.id !== viewerUserId)?.user
        : null;

    const title =
      room.type === ChatRoomType.DIRECT && peer
        ? this.formatPeerRoomName(peer.firstName, peer.lastName, peer.email)
        : room.name;
    const latestMessage = room.messages?.[0];
    const presence = peer ? this.presenceService.getPresence(peer.id) : null;

    return {
      id: room.id,
      type: room.type,
      title,
      peerUserId: peer?.id ?? null,
      peer: peer
        ? {
            id: peer.id,
            email: peer.email,
            firstName: peer.firstName,
            lastName: peer.lastName,
            ...presence,
          }
        : null,
      course: room.course ?? null,
      lastMessageAt: latestMessage?.createdAt ?? null,
      lastMessagePreview: latestMessage?.content?.slice(0, 120) ?? null,
      updatedAt: latestMessage?.createdAt ?? room.createdAt ?? null,
    };
  }
}
