'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);
  if (user && user.role !== 'ADMIN') return null;
  return (
    <AuthGuard>
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
