import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Semantic background
        canvas: {
          DEFAULT: '#F6F7FB',
          dark: '#0B1220',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#111A2E',
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#1F2A44',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.35), 0 8px 30px -8px rgba(99,102,241,0.45)',
        card: '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px -4px rgba(0,0,0,0.08)',
      },
      keyframes: {
        stripes: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        stripes: 'stripes 1.5s linear infinite',
        pulseSoft: 'pulseSoft 2.2s ease-in-out infinite',
        slideUp: 'slideUp 0.28s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
