/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        // Primary - Zovo Brand
        'zovo-violet': '#7C3AED',
        'zovo-violet-hover': '#6D28D9',
        'zovo-violet-light': '#EDE9FE',

        // Backgrounds
        'zovo-black': '#0A0A0B',
        'zovo-white': '#FAFAF9',
        'zovo-bg-secondary': '#18181B',
        'zovo-bg-tertiary': '#27272A',
        'zovo-bg-elevated': '#3F3F46',

        // Text
        'zovo-text-primary': '#FAFAF9',
        'zovo-text-secondary': '#A1A1AA',
        'zovo-text-muted': '#71717A',

        // Semantic
        'zovo-success': '#10B981',
        'zovo-warning': '#F59E0B',
        'zovo-error': '#EF4444',
        'zovo-info': '#3B82F6',

        // Borders
        'zovo-border': '#27272A',
        'zovo-border-light': '#3F3F46',

        // Focus Mode specific
        'focus-green': '#22C55E',
        'focus-red': '#EF4444',
        'focus-orange': '#F97316',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.33' }],
        sm: ['0.875rem', { lineHeight: '1.43' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.56' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.33' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      boxShadow: {
        'zovo-glow': '0 0 40px rgba(124, 58, 237, 0.25)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'focus-glow': '0 0 60px rgba(34, 197, 94, 0.3)',
      },
      borderRadius: {
        'zovo': '0.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.4)' },
        },
        timerPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
};
