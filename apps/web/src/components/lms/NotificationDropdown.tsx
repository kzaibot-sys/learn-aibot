'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';
import { Bell, Check, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.timeJustNow');
  if (mins < 60) return `${mins} ${t('notifications.timeMinutes')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t('notifications.timeHours')}`;
  const days = Math.floor(hours / 24);
  return `${days} ${t('notifications.timeDays')}`;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore(s => s.token);
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const prevCountRef = useRef(0);

  // Fetch unread count (polling every 30s)
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => apiRequest<{ count: number }>('/api/notifications/unread-count', {}, token),
    refetchInterval: 30000,
    enabled: !!token,
  });

  const unreadCount = countData?.count ?? 0;

  // Play sound on new notification
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdXiOj4+CfGp1d4GHjI6MgoJ8dneAg4mMi4aBfnp2eH+EiIuLiIN/e3h5foOHiouKhoJ+e3l6foKGiYqJhoJ+e3p7fYGFiIqJhoJ/fHp7fYGFiImJhoN/fXt7fYCEh4mIhoN/fXt7fICDhoiIhoN/fnx7fH+DhoiHhYN/fnx8fH+DhoiHhYN/fnx8fH+DhoeHhYN/fnx8fH+DhoeHhYN/fn18fH+DhoaHhIN/fn18fH+DhoaGhIN/fn18fH+DhYaGhIN/fn18fH+DhYaGhIN/fn18fH+DhYaGg4N/fn18fH+DhYaGg4N/fn18fH+DhYaGg4N/fn19fH+ChYaFg4N/f318fH+ChYWFg4N/f318fH+ChYWFg4N/f319fH+ChYWFg4J/f319fICChYWFg4J/f319fICChYWEg4J/f319fICChYWEg4J/f319fICChYWEg4J/f319fICChYWEg4KAf319fICChYSEg4KAf319fICChYSEg4KAf319fICBhISEgoKAf319fICBhISEgoKAf319fICBhISEgoJ/f319fICBhISEgoJ/f319fICBhISDgoJ/gH19fICBhISDgoJ/gH19fICBhISDgoJ/gH59fICBhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+BhISDgoJ/gH59fH+Bg4SDgoJ/gH59fH+Bg4SDgoJ/gH59fH+Bg4SDgoJ/gH59');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Fetch notifications list when dropdown opens
  const { data: notifData } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => apiRequest<{ notifications: Notification[] }>('/api/notifications?perPage=10', {}, token),
    enabled: !!token && open,
  });

  const notifications = notifData?.notifications ?? [];

  // Mark single as read
  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Mark all as read
  const markAllRead = useMutation({
    mutationFn: () => apiRequest('/api/notifications/read-all', { method: 'PATCH' }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">
              {t('notifications.title')}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t('notifications.empty')}
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-secondary/30 transition-colors ${
                    !n.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                    {n.isRead && <Check className="mt-1 w-3 h-3 text-muted-foreground shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(n.createdAt, t as (key: string) => string)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
