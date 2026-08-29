import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "Brasa" palette — orange satellite of Claude Code's terracotta,
        // pushed toward red so we don't look like a clone. Cream surfaces,
        // ink that's brownish-black, never pure gray.
        bg: {
          DEFAULT: '#0F0907',     // near-black, brown undertone
          subtle: '#1A0F08',
          panel: '#221409',
          cream: '#FFF7ED',       // landing light mode
        },
        fg: {
          DEFAULT: '#FFF7ED',     // cream foreground on dark
          muted: '#A89585',
          ink: '#1A0F08',         // dark text on cream
        },
        brasa: {
          50: '#FFF7ED',
          100: '#FFE7CC',
          200: '#FFD1A0',
          300: '#FFB266',
          400: '#FB8B3C',
          500: '#E85D1F',         // primary
          600: '#C74914',
          700: '#9C3A0F',
          800: '#6F2A0A',
        },
        accent: { DEFAULT: '#E85D1F', hover: '#C74914' },
        success: '#1F8A4C',
        warn: '#E89B1F',
        danger: '#C13415',
      },
      fontFamily: {
        sans: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(232, 93, 31, 0.35)',
        'glow-lg': '0 0 80px -20px rgba(232, 93, 31, 0.5)',
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s steps(1) infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
