import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './types/auth-jwt-payload.type';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName?: string,
  ): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }

    const passwordHash = await hash(password, 10);
    const user = await this.usersService.createStudent(
      email,
      passwordHash,
      firstName,
    );
    return this.issueTokens(user.id, user.role);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    return this.issueTokens(user.id, user.role);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenId: payload.sid },
    });

    if (!session || session.userId !== payload.sub || session.revokedAt) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or revoked',
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token expired',
      });
    }

    const matches = await compare(refreshToken, session.tokenHash);
    if (!matches) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or revoked',
      });
    }

    await this.prisma.refreshSession.update({
      where: { tokenId: payload.sid },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    return this.issueTokens(user.id, user.role);
  }

  async logout(
    userId: string,
    refreshToken: string,
  ): Promise<{ success: true }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (payload.sub !== userId) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token does not belong to current user',
      });
    }

    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        tokenId: payload.sid,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  private async issueTokens(userId: string, role: Role): Promise<AuthTokens> {
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      role,
      type: 'access',
    };
    const sessionId = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      type: 'refresh',
    };
    const accessExpiresInSec = this.parseDurationSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      15 * 60,
    );
    const refreshExpiresInSec = this.parseDurationSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      7 * 24 * 60 * 60,
    );

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresInSec,
    });

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresInSec,
    });

    const refreshTokenHash = await hash(refreshToken, 10);
    const refreshTtlMs = refreshExpiresInSec * 1000;

    await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenId: sessionId,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException({
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token payload',
        });
      }

      return payload;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid or expired',
      });
    }
  }

  private parseDurationSeconds(duration: string, defaultValue: number): number {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) {
      return defaultValue;
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return defaultValue;
    }
  }
}
