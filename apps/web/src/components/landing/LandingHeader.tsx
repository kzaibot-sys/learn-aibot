'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '#about', key: 'landing.nav.about' as const },
  { href: '#courses', key: 'landing.nav.courses' as const },
  { href: '#how-it-works', key: 'landing.nav.howItWorks' as const },
  { href: '#reviews', key: 'landing.nav.reviews' as const },
  { href: '#faq', key: 'landing.nav.faq' as const },
];

export function LandingHeader() {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleNavClick() {
    setMobileOpen(false);
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center shadow-xl shadow-orange-500/25 overflow-hidden group-hover:shadow-orange-500/40 transition-shadow">
            <GraduationCap className="w-5 h-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          <span className="text-lg font-bold text-foreground">AiBot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-secondary/50"
            >
              {t(link.key)}
            </a>
          ))}
          <a
            href="https://t.me/aibot_learn_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all"
          >
            {t('landing.nav.login')}
          </a>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href="https://t.me/aibot_learn_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/30"
          >
            {t('landing.nav.login')}
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-out panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-3 rounded-xl hover:bg-secondary/50"
                >
                  {t(link.key)}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
