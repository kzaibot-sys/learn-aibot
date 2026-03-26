'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Clock, Users, Star, Search, BookOpen, TrendingUp,
} from 'lucide-react';
import { AuthGuard } from '@/components/lms/AuthGuard';
import { Sidebar } from '@/components/lms/Sidebar';
import { TopBar } from '@/components/lms/TopBar';
import { useAuthStore } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  price: string;
  published: boolean;
  _count?: { enrollments: number; modules: number };
  modules?: { id: string; lessons: { id: string }[] }[];
}

export default function CoursesPage() {
  const token = useAuthStore(s => s.token);
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiRequest<Course[]>('/api/courses', {}, token)
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalLessons = courses.reduce((sum, c) => {
    return sum + (c.modules?.reduce((ms, m) => ms + (m.lessons?.length || 0), 0) || 0);
  }, 0);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-72">
          <TopBar />
          <main className="p-6 lg:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-black text-foreground mb-2">{t('courses.title')}</h1>
              <p className="text-muted-foreground mb-8">{t('courses.subtitle')}</p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-black text-primary">{courses.length}</p>
                  <p className="text-xs text-muted-foreground">{t('courses.total')}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-black text-primary">{totalLessons}</p>
                  <p className="text-xs text-muted-foreground">{t('courses.lessons')}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 flex items-center gap-3">
                <Star className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-black text-primary">4.8</p>
                  <p className="text-xs text-muted-foreground">{t('courses.rating')}</p>
                </div>
              </div>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative mb-8"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('courses.search')}
                className="w-full rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-sm pl-12 pr-6 py-3.5 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none placeholder:text-muted-foreground/70"
              />
            </motion.div>

            {/* Courses grid */}
            {loading ? (
              <div className="text-center py-20 text-muted-foreground">{t('common.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('courses.notFound')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Link
                      href={`/courses/${course.slug}`}
                      className="block rounded-3xl overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-card overflow-hidden">
                        {course.coverImage ? (
                          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full px-3 py-1">
                            <TrendingUp className="w-3 h-3" /> Trending
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-foreground mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0} {t('dashboard.ofLessons')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course._count?.enrollments || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                            4.8
                          </span>
                        </div>

                        <div className="rounded-xl bg-gradient-to-r from-primary via-accent to-orange-400 text-white text-center py-2.5 font-bold text-sm">
                          {t('courses.start')}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
