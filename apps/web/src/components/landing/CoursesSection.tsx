'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { ScrollReveal } from '@/hooks/useScrollAnimation';

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
        <ScrollReveal className="text-center mb-14">
          <h2 className="text-3xl font-black text-foreground sm:text-4xl mb-4">
            {t('landing.courses.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {t('landing.courses.subtitle')}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <ScrollReveal
              key={course.id}
              delay={i * 100}
            >
              <Link
                href={`/courses/${course.slug}`}
                className="glass-card hover-lift block rounded-2xl overflow-hidden group"
              >
                {course.coverUrl ? (
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={course.coverUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
                    <BookOpen className="w-14 h-14 text-primary/50 relative z-10" />
                  </div>
                )}
                <div className="p-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-3">
                    <BookOpen className="w-3 h-3" />
                    {t('landing.courses.view')}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t('landing.courses.view')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
