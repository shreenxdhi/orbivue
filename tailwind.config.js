/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E6F1F8',
          200: '#BFD9EB',
          300: '#99C2DE',
          400: '#66A0CA',
          500: '#337DB7',
          600: '#1E5C8D',
          700: '#164568',
          800: '#0F2E44',
          900: '#071722',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} 