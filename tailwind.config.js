/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#0b0d11',
          900: '#12151c',
          850: '#171b24',
          800: '#1e2330',
          750: '#252b3b',
          700: '#2e3649',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        accent: {
          DEFAULT: '#0ea5e9',
          hover: '#0284c7',
          dark: '#0369a1',
          light: '#38bdf8',
          subtle: 'rgba(14, 165, 233, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
