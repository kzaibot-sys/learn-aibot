'use client';

import { createContext, useContext, type ReactNode } from 'react';
import React from 'react';

interface ThemeContextType {
  dark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return React.createElement(
    ThemeContext.Provider,
    { value: { dark: false, toggleTheme: () => {} } },
    children,
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
