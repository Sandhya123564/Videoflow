/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#07080d",
          900: "#0c0e16",
          800: "#141824",
          700: "#1c2233",
        },
        accent: {
          400: "#7c9cff",
          500: "#5b7cfa",
          600: "#3d5ef0",
        },
      },
    },
  },
  plugins: [],
};
