'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [user, router]);
  if (user && user.role !== 'ADMIN') return null;
  return <>{children}</>;
}
