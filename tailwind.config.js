/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', /* Indigo 500 */
          600: '#4f46e5', /* Indigo 600 - Main Brand */
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        primary: {
          50: '#e0fbff',
          100: '#bdf7ff',
          200: '#8cf3ff',
          300: '#4addf2', 
          400: '#45edf2', /* Main Cyan */
          500: '#06b6d4', /* Cyan 500 */
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        dark: {
          bg: '#020617',      /* Slate 950 - Pure Dark */
          surface: '#0f172a', /* Slate 900 - Dark Surface */
          border: '#1e293b',  /* Slate 800 - Borders */
        }
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
