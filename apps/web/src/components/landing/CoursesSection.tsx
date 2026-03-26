'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
}

export function CoursesSection() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/courses`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setCourses(data.data);
      })
      .catch(() => {});
  }, []);

  if (courses.length === 0) return null;

  return (
    <section id="courses" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            {t('landing.courses.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
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
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                href={`/courses/${course.slug}`}
                className="block rounded-2xl bg-card border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group"
              >
                {course.coverUrl ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={course.coverUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary/40" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {t('landing.courses.view')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
