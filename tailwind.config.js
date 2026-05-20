/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'orb-float': 'orb-float 12s ease-in-out infinite',
        'orb-float-slow': 'orb-float 18s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease forwards',
        'blink': 'blink 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'scan': 'scan 5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        'orb-float': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(50px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 20px) scale(0.9)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(168,85,247,0.3), 0 0 30px rgba(168,85,247,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.2)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-500% center' },
          '100%': { backgroundPosition: '500% center' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(800%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
