'use client';

import { GraduationCap } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LearnHub Pro. {t('landing.footer.rights')}
          </span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.privacy')}</a>
          <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.terms')}</a>
        </div>
      </div>
    </footer>
  );
}
