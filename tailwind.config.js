/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aerospace: {
          950: '#060913', // Ultra deep space background
          900: '#0b1120', // Main dark canvas
          850: '#10192e', // Card background
          800: '#16233b', // Hover / elevated card
          700: '#1f3152', // Border / subtle highlight
          600: '#2d4673',
          accent: '#38bdf8', // Cyan primary highlight
          accentHover: '#0284c7',
          cyanGlow: 'rgba(56, 189, 248, 0.15)',
          emeraldGlow: 'rgba(16, 185, 129, 0.15)',
          amberGlow: 'rgba(245, 158, 11, 0.15)',
          roseGlow: 'rgba(244, 63, 94, 0.15)',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
