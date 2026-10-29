/** @type {import('tailwindcss').Config} */
// AERO3D design system. The app is written with stock Tailwind palette names (slate/sky/emerald/...),
// so the brand palette is applied by redefining those scales here. Every existing class picks it up.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        aerospace: {
          950: '#080D17', // page background
          900: '#0C1320', // app canvas / sidebar
          850: '#101827', // surface (cards)
          800: '#172235', // elevated panel
          700: '#2B394D', // borders, dividers
          600: '#3A4C66',
          accent: '#45D6E8',
          accentHover: '#6BE0EE',
          cyanGlow: 'rgba(69, 214, 232, 0.12)',
          emeraldGlow: 'rgba(54, 201, 143, 0.12)',
          amberGlow: 'rgba(242, 183, 102, 0.12)',
          roseGlow: 'rgba(255, 116, 126, 0.12)',
        },
        // Neutral scale re-tuned to the navy brand surfaces (text-400 = #A5B2C5 secondary text)
        slate: {
          50: '#F4F7FB', 100: '#F4F7FB', 200: '#DCE4EF', 300: '#C2CDDC', 400: '#A5B2C5',
          500: '#7C8AA0', 600: '#4B5B73', 700: '#2B394D', 800: '#212E41', 900: '#101827', 950: '#080D17',
        },
        // Primary accent: cyan #45D6E8
        sky: {
          50: '#ECFCFE', 100: '#D3F7FB', 200: '#ABEFF6', 300: '#86E6F1', 400: '#5CDCEC',
          500: '#45D6E8', 600: '#2DB6C9', 700: '#1F8E9E', 800: '#1B6E7B', 900: '#16505A', 950: '#0B2C33',
        },
        // Secondary accent: periwinkle #8B9CFF
        indigo: {
          50: '#F1F3FF', 100: '#E1E5FF', 200: '#C5CCFF', 300: '#A9B4FF', 400: '#8B9CFF',
          500: '#6F82F5', 600: '#5668DC', 700: '#4452B5', 800: '#363F8C', 900: '#2A3169', 950: '#171B3D',
        },
        // Semantic colours
        emerald: {
          50: '#EAFBF4', 100: '#CCF5E3', 200: '#9DEACB', 300: '#6FDDB1', 400: '#36C98F',
          500: '#2AB07B', 600: '#1F8F63', 700: '#1B724F', 800: '#175A41', 900: '#134A37', 950: '#082B20',
        },
        amber: {
          50: '#FEF7EB', 100: '#FCEBCC', 200: '#F9D9A3', 300: '#F5C77F', 400: '#F2B766',
          500: '#E39F44', 600: '#C27F2D', 700: '#9A6122', 800: '#7A4D20', 900: '#64401E', 950: '#382109',
        },
        rose: {
          50: '#FFF1F2', 100: '#FFE0E2', 200: '#FFC2C6', 300: '#FF9DA4', 400: '#FF747E',
          500: '#F4535E', 600: '#D93946', 700: '#B52C38', 800: '#922632', 900: '#782530', 950: '#430F15',
        },
        // Light content sections
        paper: { DEFAULT: '#F4F7FA', ink: '#172033', muted: '#51607A', line: '#D7DFEA' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk Variable"', '"Space Grotesk"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      // Slightly larger interface scale: nothing below 13px
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],
        sm: ['0.9375rem', { lineHeight: '1.5rem' }],
        base: ['1rem', { lineHeight: '1.65rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.8rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.1rem' }],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.6)',
        focus: '0 0 0 3px rgba(69,214,232,0.35)',
      },
      transitionDuration: { DEFAULT: '180ms' },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
