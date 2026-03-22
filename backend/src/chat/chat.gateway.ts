import { HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccessTokenPayload } from '../auth/types/auth-jwt-payload.type';
import { PresenceService } from '../presence/presence.service';
import { ChatMessagePayload, ChatService } from './chat.service';

type JoinRoomPayload = {
  roomId: string;
};

type SendMessagePayload = {
  roomId: string;
  content: string;
};

type ChatSocketData = {
  userId?: string;
  role?: Role;
};

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn('Chat socket connected without token');
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );

      if (payload.type !== 'access') {
        client.disconnect(true);
        return;
      }

      const data = client.data as ChatSocketData;
      data.userId = payload.sub;
      data.role = payload.role;
      this.presenceService.markOnline(payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as ChatSocketData).userId;
    if (!userId) {
      return;
    }
    this.presenceService.markOffline(userId);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinRoomPayload,
  ) {
    const userId = (client.data as ChatSocketData).userId;
    if (!userId || !body?.roomId) {
      return { ok: false, code: 'CHAT_WS_INVALID_PAYLOAD' };
    }

    try {
      await this.chatService.assertRoomMember(body.roomId, userId);
      this.presenceService.markHeartbeat(userId);
    } catch {
      return { ok: false, code: 'CHAT_NOT_MEMBER' };
    }

    await client.join(this.roomChannel(body.roomId));
    return { ok: true, roomId: body.roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessagePayload,
  ) {
    const userId = (client.data as ChatSocketData).userId;
    if (!userId || !body?.roomId || typeof body.content !== 'string') {
      return { ok: false, code: 'CHAT_WS_INVALID_PAYLOAD' };
    }

    const trimmed = body.content.trim();
    if (trimmed.length === 0 || trimmed.length > 10000) {
      return { ok: false, code: 'CHAT_INVALID_MESSAGE_CONTENT' };
    }

    try {
      this.presenceService.markHeartbeat(userId);
      const message = await this.chatService.createMessage(
        userId,
        body.roomId,
        trimmed,
      );
      this.emitMessageCreated(body.roomId, message);
      return { ok: true, message };
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        const body = err.getResponse();
        const code =
          typeof body === 'object' &&
          body !== null &&
          'code' in body &&
          typeof (body as { code: unknown }).code === 'string'
            ? (body as { code: string }).code
            : 'CHAT_MESSAGE_FAILED';
        return { ok: false, code };
      }
      this.logger.error(err);
      return { ok: false, code: 'CHAT_MESSAGE_FAILED' };
    }
  }

  emitMessageCreated(roomId: string, message: ChatMessagePayload) {
    this.server
      .to(this.roomChannel(roomId))
      .emit('messageCreated', { message });
  }

  private roomChannel(roomId: string): string {
    return `room:${roomId}`;
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: unknown } | undefined;
    if (auth && typeof auth.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    const q = client.handshake.query.token;
    if (typeof q === 'string' && q.length > 0) {
      return q;
    }
    if (Array.isArray(q) && typeof q[0] === 'string' && q[0].length > 0) {
      return q[0];
    }

    return null;
  }
}
