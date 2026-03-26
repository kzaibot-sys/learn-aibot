'use client';

import { useState } from 'react';

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Найти что угодно... курсы, статьи, преподавателей"
            className="w-full rounded-xl bg-dark-input border border-dark-border pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4">
        {/* Language */}
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-hover transition-colors text-xs">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          RU
        </button>

        {/* Theme toggle */}
        <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-hover transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-dark-hover transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
        </button>
      </div>
    </header>
  );
}
