import { Injectable } from '@nestjs/common';

type PresenceSession = {
  connections: number;
  lastSeenAt: number;
};

export type PresenceSnapshot = {
  isOnline: boolean;
  lastSeenAt: string | null;
};

@Injectable()
export class PresenceService {
  private readonly sessions = new Map<string, PresenceSession>();
  private readonly recentWindowMs = 2 * 60 * 1000;

  markOnline(userId: string) {
    const current = this.sessions.get(userId);
    if (!current) {
      this.sessions.set(userId, { connections: 1, lastSeenAt: Date.now() });
      return;
    }
    current.connections += 1;
    current.lastSeenAt = Date.now();
    this.sessions.set(userId, current);
  }

  markHeartbeat(userId: string) {
    const current = this.sessions.get(userId);
    if (!current) {
      this.sessions.set(userId, { connections: 0, lastSeenAt: Date.now() });
      return;
    }
    current.lastSeenAt = Date.now();
    this.sessions.set(userId, current);
  }

  markOffline(userId: string) {
    const current = this.sessions.get(userId);
    if (!current) {
      this.sessions.set(userId, { connections: 0, lastSeenAt: Date.now() });
      return;
    }
    current.connections = Math.max(0, current.connections - 1);
    current.lastSeenAt = Date.now();
    this.sessions.set(userId, current);
  }

  getPresence(userId: string): PresenceSnapshot {
    const current = this.sessions.get(userId);
    if (!current) {
      return { isOnline: false, lastSeenAt: null };
    }

    const now = Date.now();
    const activeRecently = now - current.lastSeenAt <= this.recentWindowMs;
    return {
      isOnline: current.connections > 0 || activeRecently,
      lastSeenAt: new Date(current.lastSeenAt).toISOString(),
    };
  }

  getPresenceMap(userIds: string[]) {
    return userIds.reduce<Record<string, PresenceSnapshot>>((acc, userId) => {
      acc[userId] = this.getPresence(userId);
      return acc;
    }, {});
  }
}
