'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth';

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
  confirmedAt: string | null;
  user: { id: string; email: string | null; firstName: string | null; lastName: string | null };
  course: { id: string; title: string; slug: string };
}

interface PaginationMeta {
  page: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  REFUNDED: 'bg-muted/50 text-muted-foreground',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminPaymentsPage() {
  const token = useAuthStore(s => s.token);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20' });
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(
        `${API_URL}/api/admin/payments?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setPayments(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, statusFilter]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Платежи</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['', 'PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-secondary/50 text-muted-foreground hover:bg-border/50'
            }`}
          >
            {s || 'Все'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Нет платежей</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Дата</th>
                  <th className="pb-3 font-medium">Пользователь</th>
                  <th className="pb-3 font-medium">Курс</th>
                  <th className="pb-3 font-medium">Сумма</th>
                  <th className="pb-3 font-medium">Провайдер</th>
                  <th className="pb-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border/30">
                    <td className="py-3 text-muted-foreground text-xs">
                      {new Date(p.createdAt).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-foreground">{p.user.email || p.user.firstName || p.user.id.slice(0, 8)}</td>
                    <td className="py-3 text-muted-foreground">{p.course.title}</td>
                    <td className="py-3 text-foreground font-medium">{p.amount} {p.currency}</td>
                    <td className="py-3 text-muted-foreground text-xs">{p.provider}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status] || 'bg-secondary/50 text-muted-foreground'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-lg border border-border/50 px-3 py-1 text-sm text-muted-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors"
              >
                Назад
              </button>
              <span className="text-sm text-muted-foreground">{page} / {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-border/50 px-3 py-1 text-sm text-muted-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
