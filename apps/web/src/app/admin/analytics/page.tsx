'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth';

interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  totalPayments: number;
  totalRevenue: number;
  recentPayments: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminAnalyticsPage() {
  const token = useAuthStore(s => s.token);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        // Fetch counts from existing endpoints
        const [studentsRes, paymentsRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/students?perPage=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/payments?perPage=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/courses?perPage=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const students = await studentsRes.json();
        const payments = await paymentsRes.json();
        const courses = await coursesRes.json();

        // Fetch confirmed payments for revenue
        const confirmedRes = await fetch(`${API_URL}/api/admin/payments?status=CONFIRMED&perPage=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const confirmed = await confirmedRes.json();

        const totalRevenue = (confirmed.data || []).reduce(
          (sum: number, p: { amount: string }) => sum + Number(p.amount), 0
        );

        // Group by date for chart data
        const byDate = new Map<string, { count: number; revenue: number }>();
        for (const p of confirmed.data || []) {
          const date = new Date(p.createdAt).toLocaleDateString('ru');
          const existing = byDate.get(date) || { count: 0, revenue: 0 };
          existing.count++;
          existing.revenue += Number(p.amount);
          byDate.set(date, existing);
        }

        setData({
          totalStudents: students.meta?.total ?? 0,
          totalCourses: courses.meta?.total ?? 0,
          totalPayments: payments.meta?.total ?? 0,
          totalRevenue,
          recentPayments: Array.from(byDate.entries())
            .map(([date, vals]) => ({ date, ...vals }))
            .slice(-14),
        });
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) loadAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Не удалось загрузить аналитику</p>;
  }

  const cards = [
    { label: 'Студенты', value: data.totalStudents, color: 'text-primary' },
    { label: 'Курсы', value: data.totalCourses, color: 'text-purple-400' },
    { label: 'Платежи', value: data.totalPayments, color: 'text-green-400' },
    { label: 'Выручка', value: `${data.totalRevenue.toLocaleString('ru')} RUB`, color: 'text-yellow-400' },
  ];

  const maxRevenue = Math.max(...data.recentPayments.map(d => d.revenue), 1);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Аналитика</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5">
            <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart (simple bar chart) */}
      {data.recentPayments.length > 0 && (
        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Выручка по дням</h2>
          <div className="flex items-end gap-1 h-40">
            {data.recentPayments.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/60 rounded-t min-h-[2px] transition-all"
                  style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                  title={`${day.date}: ${day.revenue.toLocaleString('ru')} RUB (${day.count} платежей)`}
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {day.date.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
