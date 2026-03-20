/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#1a1a2e',
          surface: '#16213e',
          accent: '#0f3460',
          highlight: '#e94560',
          text: '#eaeaea',
          muted: '#8892a4',
        },
        panel: '#0d0d1a',
        transport: '#0a0a18',
        runner: '#080814',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'node-enter': 'node-enter 0.4s ease-out',
        'node-flash': 'node-flash 0.6s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px var(--glow-color, rgba(74, 222, 128, 0.3))' },
          '50%': { boxShadow: '0 0 16px 6px var(--glow-color, rgba(74, 222, 128, 0.5))' },
        },
        'node-enter': {
          '0%': { opacity: '0', transform: 'scale(0.8) translateX(40px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateX(0)' },
        },
        'node-flash': {
          '0%': { boxShadow: '0 0 0 0 var(--flash-color, rgba(233, 69, 96, 0.6))' },
          '50%': { boxShadow: '0 0 20px 8px var(--flash-color, rgba(233, 69, 96, 0.4))' },
          '100%': { boxShadow: '0 0 0 0 var(--flash-color, rgba(233, 69, 96, 0))' },
        },
      },
    },
  },
  plugins: [],
};
