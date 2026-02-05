
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,pages,contexts,services}/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}