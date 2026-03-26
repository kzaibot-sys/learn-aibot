'use client';

import Link from 'next/link';
import { GraduationCap, Send, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center shadow-lg shadow-primary/25">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">AiBot</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('landing.footer.description')}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('landing.footer.navTitle')}</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.about')}
                </a>
              </li>
              <li>
                <a href="#courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.courses')}
                </a>
              </li>
              <li>
                <a href="#reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.reviews')}
                </a>
              </li>
              <li>
                <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.howItWorks')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('landing.footer.legalTitle')}</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.terms')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('landing.footer.offer')}
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t('landing.footer.socialTitle')}</h4>
            <div className="flex gap-3">
              <a
                href="https://t.me/aibot_edu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/77001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {t('landing.footer.contact')}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 {t('landing.footer.company')}. {t('landing.footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
