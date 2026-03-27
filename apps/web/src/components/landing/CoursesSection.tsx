'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  _count?: { modules?: number; lessons?: number };
}

export function CoursesSection() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/courses`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCourses(data.data);
      })
      .catch(() => {});
  }, []);

  if (courses.length === 0) return null;

  return (
    <section id="courses" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-black text-foreground sm:text-4xl lg:text-5xl mb-4">
            {t('landing.courses.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {t('landing.courses.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="glass-card hover-lift rounded-2xl overflow-hidden group cursor-default h-full flex flex-col">
                {course.coverUrl ? (
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={course.coverUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-orange-500/15 to-amber-400/15 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,133,51,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,133,51,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
                    <BookOpen className="w-14 h-14 text-primary/50 relative z-10" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-xs font-semibold text-primary mb-3 w-fit">
                    <BookOpen className="w-3 h-3" />
                    {t('landing.courses.view')}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t('landing.courses.view')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
