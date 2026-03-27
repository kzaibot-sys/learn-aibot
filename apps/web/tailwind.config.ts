import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: '#e6772e',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: '#ffffff',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: 'var(--color-popover)',
        secondary: 'var(--color-secondary)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        destructive: 'var(--color-destructive)',
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
        'orange-400': 'var(--color-orange-400)',
      },
      borderRadius: {
        'sm': 'calc(1rem - 4px)',
        'md': 'calc(1rem - 2px)',
        'lg': '1rem',
        'xl': 'calc(1rem + 4px)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
