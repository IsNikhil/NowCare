/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0e1a',
          900: '#0f1420',
          800: '#161b2c',
          700: '#1f2637',
          600: '#2a3348',
        },
        mist: {
          50: '#f6f9fc',
          100: '#eef3f9',
          200: '#e3ebf5',
          300: '#d1dcea',
          400: '#b6c4d7',
        },
        teal: {
          700: '#0f766e',
          600: '#0d9488',
          500: '#14b8a6',
          400: '#2dd4bf',
          300: '#5eead4',
          200: '#99f6e4',
        },
        coral: {
          600: '#e85d52',
          500: '#f97066',
          400: '#fb7185',
        },
        amber: {
          600: '#d97706',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        },
        violet: {
          600: '#7c3aed',
          500: '#8b5cf6',
          400: '#a78bfa',
          300: '#c4b5fd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Consolas', 'monospace'],
      },
      animation: {
        'aura-1': 'aurora-drift-1 24s ease-in-out infinite',
        'aura-2': 'aurora-drift-2 32s ease-in-out infinite',
        'aura-3': 'aurora-drift-3 40s ease-in-out infinite',
        'fade-up': 'fadeUp 280ms cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fadeIn 280ms ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 1.4s linear infinite',
        'conic-spin': 'conic-spin 8s linear infinite',
        'slide-up': 'slideUp 320ms cubic-bezier(0.22,1,0.36,1)',
        'slide-down': 'slideDown 280ms cubic-bezier(0.22,1,0.36,1)',
        'slide-in-left': 'slideInLeft 320ms cubic-bezier(0.22,1,0.36,1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
      },
      boxShadow: {
        'glow-teal': '0 0 30px -8px hsla(168,76%,42%,0.4)',
        'glow-coral': '0 0 30px -8px hsla(8,90%,65%,0.4)',
        'glow-amber': '0 0 30px -8px hsla(38,95%,60%,0.4)',
        'glow-violet': '0 0 30px -8px hsla(265,70%,65%,0.4)',
      },
    },
  },
  plugins: [],
}
