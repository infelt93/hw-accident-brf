import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        hanwha: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f37321',
          600: '#ea650d',
          700: '#c94f08',
          900: '#3f2412'
        },
        calm: {
          50: '#f8fafc',
          100: '#eef2f7',
          200: '#d9e2ef',
          500: '#64748b',
          700: '#334155'
        }
      },
      boxShadow: {
        soft: '0 18px 60px rgba(120, 53, 15, 0.12)'
      },
      keyframes: {
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.18)', opacity: '0.55' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(180%)' }
        }
      },
      animation: {
        pulseRing: 'pulseRing 1.15s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
