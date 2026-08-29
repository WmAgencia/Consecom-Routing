import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand-neutral palette (swappable per brand).
        bg: { DEFAULT: '#0a0a0b', subtle: '#131316', panel: '#1a1a1f' },
        fg: { DEFAULT: '#f5f5f7', muted: '#a1a1aa' },
        accent: { DEFAULT: '#6366f1', hover: '#818cf8' },
        success: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;