'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

function PrefetchData() {
  const token = useAuthStore(s => s.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;
    // Prefetch courses and progress on any LMS page load
    queryClient.prefetchQuery({
      queryKey: ['courses'],
      queryFn: () => apiRequest('/api/courses', {}, token),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: ['my-progress'],
      queryFn: () => apiRequest('/api/courses/my-progress', {}, token),
      staleTime: 5 * 60 * 1000,
    });
    queryClient.prefetchQuery({
      queryKey: ['my-certificates'],
      queryFn: () => apiRequest('/api/certificates/my', {}, token),
      staleTime: 5 * 60 * 1000,
    });
  }, [token, queryClient]);

  return null;
}

export default function LMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PrefetchData />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-72 ml-0">
          <TopBar />
          <main className="p-3 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
