/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#12121f',
          surface: '#181830',
          accent: '#1e2a4a',
          highlight: '#e94560',
          text: '#f0f0f5',
          muted: '#7a839b',
        },
        panel: '#0e0e1a',
        transport: '#0a0a16',
        runner: '#080812',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'node-enter': 'node-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'node-flash': 'node-flash 0.6s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'breathe': 'breathe 3s ease-in-out infinite',
        'mic-pulse': 'mic-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px var(--glow-color, rgba(74, 222, 128, 0.25))' },
          '50%': { boxShadow: '0 0 20px 8px var(--glow-color, rgba(74, 222, 128, 0.5))' },
        },
        'node-enter': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateX(30px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateX(0)' },
        },
        'node-flash': {
          '0%': { boxShadow: '0 0 0 0 var(--flash-color, rgba(233, 69, 96, 0.6))' },
          '50%': { boxShadow: '0 0 24px 10px var(--flash-color, rgba(233, 69, 96, 0.35))' },
          '100%': { boxShadow: '0 0 0 0 var(--flash-color, rgba(233, 69, 96, 0))' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'mic-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(233, 69, 96, 0.15)',
        'glow-md': '0 0 16px rgba(233, 69, 96, 0.2)',
        'glow-green': '0 0 12px rgba(74, 222, 128, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
};
