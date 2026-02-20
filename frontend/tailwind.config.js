/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#121212',
        'surface-container': '#1E1E1E',
        primary: '#BB86FC',
        'on-primary': '#000000',
        secondary: '#03DAC6',
        'on-secondary': '#000000',
        error: '#CF6679',
      }
    },
  },
  plugins: [],
}
