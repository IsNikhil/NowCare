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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'aura-1': 'aura1 22s ease-in-out infinite',
        'aura-2': 'aura2 28s ease-in-out infinite',
        'aura-3': 'aura3 35s ease-in-out infinite',
        'fade-up': 'fadeUp 200ms ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        aura1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(60px, 40px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 20px) scale(0.95)' },
        },
        aura2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-50px, 60px) scale(0.9)' },
          '66%': { transform: 'translate(30px, -30px) scale(1.05)' },
        },
        aura3: {
          '0%, 100%': { transform: 'translate(-50%, 0) scale(1)' },
          '50%': { transform: 'translate(-50%, -50px) scale(1.08)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
