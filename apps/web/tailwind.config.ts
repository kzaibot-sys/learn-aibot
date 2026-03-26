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
        brand: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FDBA74',
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        dark: {
          bg: '#0A0A0B',
          card: '#141416',
          sidebar: '#111113',
          input: '#1C1C1F',
          border: '#27272A',
          hover: '#1E1E21',
        },
      },
    },
  },
  plugins: [],
};

export default config;
