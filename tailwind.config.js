/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f4',
          100: '#fbe8ec',
          200: '#f5ced7',
          300: '#efa6b7',
          400: '#e46d88',
          500: '#d43e62',
          600: '#b51a41',
          700: '#960e33',
          800: '#800020', // FXEC Primary
          900: '#6a001b',
          950: '#3f000d',
          DEFAULT: '#800020',
        },
        fx: {
          burgundy: '#800020',
          dark: '#580016',
          light: '#fdf5f6',
          gold: '#D4AF37', // Accent for certificates/points
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
