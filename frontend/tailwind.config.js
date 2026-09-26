/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wordle-green': '#538d4e',
        'wordle-yellow': '#b59f3b',
        'wordle-gray': '#3a3a3c',
        'wordle-dark': '#121213',
        'wordle-border': '#3a3a3c',
        'wordle-filled': '#818384',
        'wordle-highlight': '#569aff',
      }
    },
  },
  plugins: [],
}
