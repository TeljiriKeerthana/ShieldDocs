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
          50: '#e0fbff',
          100: '#bdf7ff',
          200: '#8cf3ff',
          300: '#4addf2',
          400: '#45edf2', /* main cyan */
          500: '#45edf2', /* mapped 500 to main cyan */
          600: '#08829a',
          700: '#0c687e',
          800: '#0b5668',
          900: '#0c4858',
          950: '#042f3d',
        },
        primary: {
          50: '#e0fbff',
          100: '#bdf7ff',
          200: '#8cf3ff',
          300: '#4addf2', 
          400: '#45edf2', /* main cyan */
          500: '#45edf2', /* mapped 500 to main cyan */
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
