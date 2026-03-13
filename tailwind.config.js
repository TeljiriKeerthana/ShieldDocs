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
          50: '#f0eaff',
          100: '#e4d5ff',
          200: '#c6c6fc', /* light mute */
          300: '#ab8cff',
          400: '#8a5cff',
          500: '#4f2990', /* main purple */
          600: '#3e1e75',
          700: '#2e155c',
          800: '#200e42',
          900: '#0d0b26', /* main dark bg */
          950: '#060412',
        },
        primary: {
          50: '#e0fbff',
          100: '#bdf7ff',
          200: '#8cf3ff',
          300: '#45edf2', /* main cyan */
          400: '#26c5db',
          500: '#0ea4bc',
          600: '#08829a',
          700: '#0c687e',
          800: '#0b5668',
          900: '#0c4858',
          950: '#042f3d',
        },
        dark: {
          bg: '#0d0b26',
          surface: '#15123d',
          border: '#332468',
        }
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
