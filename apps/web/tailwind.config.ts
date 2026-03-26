import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff8533',
          hover: '#e6772e',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#ffaa66',
          foreground: '#ffffff',
        },
        background: '#0a0a0f',
        foreground: '#f0f0f3',
        card: {
          DEFAULT: '#141419',
          foreground: '#f0f0f3',
        },
        popover: '#1a1a1f',
        secondary: '#1a1a1f',
        muted: {
          DEFAULT: '#1f1f26',
          foreground: '#9a9aa5',
        },
        border: '#2a2a35',
        input: '#1a1a1f',
        ring: '#ff8533',
        destructive: '#ff4444',
        /* Compat aliases for LMS pages */
        brand: {
          DEFAULT: '#ff8533',
          hover: '#e6772e',
          light: '#ffaa66',
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#ff8533',
          600: '#e6772e',
          700: '#c2410c',
        },
        dark: {
          bg: '#0a0a0f',
          card: '#141419',
          sidebar: '#0a0a0f',
          input: '#1a1a1f',
          border: '#2a2a35',
          hover: '#1f1f26',
        },
      },
      borderRadius: {
        'sm': 'calc(1rem - 4px)',
        'md': 'calc(1rem - 2px)',
        'lg': '1rem',
        'xl': 'calc(1rem + 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
