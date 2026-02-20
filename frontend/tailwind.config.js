/** @type {import('tailwindcss').Config} */
export default {
  content:,
  theme: {
    extend: {
      colors: {
        background: "#111318",
        surface: "#1E2128",
        "surface-container": "#2A2D35",
        primary: "#a8c7fa",
        "on-primary": "#003062",
        secondary: "#cce8e9",
        "on-secondary": "#051f23",
        error: "#ffb4ab"
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      }
    },
  },
  plugins:[],
}
