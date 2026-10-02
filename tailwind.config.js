/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paddy: {
          50: '#F4F8F4',
          100: '#E6EFE6',
          200: '#C9DEC9',
          300: '#A4C8A4',
          400: '#75AB75',
          500: '#4A8F4A',
          600: '#387338',
          700: '#2A572A',
          800: '#1F4220',
          900: '#142C15',
          950: '#0C1C0D',
        },
        harvest: {
          50: '#FEFAF0',
          100: '#FCF3DC',
          200: '#F7E4B3',
          300: '#F2D385',
          400: '#EBBF52',
          500: '#D4A338',
          600: '#B88523',
          700: '#94661A',
          800: '#785018',
          900: '#634217',
        },
        earth: {
          50: '#FAF8F4',
          100: '#F3EFE6',
          200: '#E6DECE',
          300: '#D5C9B3',
          400: '#BDB096',
          500: '#A39478',
          600: '#8A7B61',
          700: '#6E624E',
          800: '#5A5040',
          900: '#4A4236',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
};
